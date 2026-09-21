import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Clip } from '../models/Clip.js';
import { Video } from '../models/Video.js';
import { Project } from '../models/Project.js';
import { Export } from '../models/Export.js';
import { storageService, StorageKeys } from '../services/storage/StorageService.js';
import { exportService } from '../services/ExportService.js';
import { jobQueue } from '../jobs/JobQueue.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

export const exportClip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // clipId
    const userId = req.user!._id;

    const clip = await Clip.findOne({ _id: id, userId });
    if (!clip) {
      res.status(404).json({ success: false, message: 'Clip not found.' });
      return;
    }

    const video = await Video.findById(clip.videoId);
    if (!video) {
      res.status(404).json({ success: false, message: 'Parent video not found.' });
      return;
    }

    const {
      startTime,
      endTime,
      aspectRatio = '9:16',
      resolution = '1080p',
      filter = 'normal',
      filterIntensity = 100,
      adjustments,
      stickers = [],
      speed = 1.0,
      volume = 100,
      textOverlays = [],
      overlayMusic,
      transition,
      effect,
      soundEffects,
      voiceEffect,
      watermark,
      speedCurve,
      keyframes,
      preset = 'veryfast',
    } = req.body;

    const validPresets = ['ultrafast', 'veryfast', 'fast'];
    const safePreset: 'ultrafast' | 'veryfast' | 'fast' = validPresets.includes(preset) ? preset : 'veryfast';

    const validAspectRatios = ['9:16', '16:9', '1:1', '4:5', 'original'];
    const safeAspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original' = validAspectRatios.includes(aspectRatio) ? (aspectRatio as any) : '9:16';

    const validFilters = [
      'normal',
      'bright',
      'contrast',
      'cinematic',
      'warm',
      'cool',
      'vibrant',
      'vintage',
      'faded',
      'dramatic',
      'cyberpunk',
      'grayscale',
    ];
    const safeFilter: any = validFilters.includes(filter) ? filter : 'normal';
    const safeFilterIntensity = Math.max(0, Math.min(100, Number(filterIntensity) !== undefined && !isNaN(Number(filterIntensity)) ? Number(filterIntensity) : 100));

    const validResolutions = ['720p', '1080p', '4k'];
    const safeResolution: '720p' | '1080p' | '4k' = validResolutions.includes(resolution) ? resolution : '1080p';

    // Use clip's extracted file as source, or parent video with offset
    const sourceVideoPath = (clip.filePath && fs.existsSync(clip.filePath) ? clip.filePath : video.filePath) || '';
    if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
      res.status(404).json({ success: false, message: 'Source video file not found on disk.' });
      return;
    }
    // If source is the clip itself, start time is relative (0) or specified within clip duration
    const effectiveStart = sourceVideoPath === clip.filePath ? (startTime || 0) : (startTime !== undefined ? startTime : clip.startTime);
    const effectiveEnd = sourceVideoPath === clip.filePath ? (endTime || clip.duration) : (endTime !== undefined ? endTime : clip.endTime);

    // Resolve overlay music file if supplied
    let overlayMusicConfig: any = undefined;
    if (overlayMusic && (overlayMusic.fileName || overlayMusic.url)) {
      const fileName = overlayMusic.fileName || (overlayMusic.url ? path.basename(overlayMusic.url) : '');
      if (fileName) {
        const possiblePath = path.join(config.uploadDir, fileName);
        if (fs.existsSync(possiblePath)) {
          overlayMusicConfig = {
            filePath: possiblePath,
            volume: overlayMusic.volume !== undefined ? Math.max(0, Math.min(150, Number(overlayMusic.volume))) : 50,
            loop: overlayMusic.loop !== false,
            startTime: overlayMusic.startTime ? Math.max(0, Number(overlayMusic.startTime)) : 0,
            fadeIn: overlayMusic.fadeIn ? Math.max(0, Number(overlayMusic.fadeIn)) : 0,
            fadeOut: overlayMusic.fadeOut ? Math.max(0, Number(overlayMusic.fadeOut)) : 0,
          };
        }
      }
    }

    // Persist project settings
    let project = await Project.findOne({ clipId: clip._id, userId });
    if (!project) {
      project = new Project({ userId, videoId: video._id, clipId: clip._id });
    }
    project.edits = {
      startTime: effectiveStart,
      endTime: effectiveEnd,
      aspectRatio: safeAspectRatio,
      filter: safeFilter,
      filterIntensity: safeFilterIntensity,
      adjustments: adjustments || { brightness: 0, contrast: 0, saturation: 0, warmth: 0, vignette: 0 },
      stickers: stickers || [],
      speed: Number(speed),
      volume: Number(volume),
      textOverlays: textOverlays || [],
      transition,
      effect,
      soundEffects,
      voiceEffect,
      watermark,
      speedCurve,
      keyframes,
    };
    if (overlayMusic && (overlayMusic.url || overlayMusic.fileName)) {
      const fileName = overlayMusic.fileName || (overlayMusic.url ? path.basename(overlayMusic.url) : '');
      project.edits.overlayMusic = {
        url: overlayMusic.url || '',
        fileName: fileName || '',
        name: overlayMusic.name || overlayMusic.originalName || '',
        originalName: overlayMusic.originalName || '',
        volume: overlayMusic.volume !== undefined ? Number(overlayMusic.volume) : 50,
        loop: overlayMusic.loop !== false,
        startTime: overlayMusic.startTime ? Number(overlayMusic.startTime) : 0,
        fadeIn: overlayMusic.fadeIn ? Number(overlayMusic.fadeIn) : 0,
        fadeOut: overlayMusic.fadeOut ? Number(overlayMusic.fadeOut) : 0,
      };
    } else {
      project.edits.overlayMusic = undefined;
    }
    project.exportSettings = {
      resolution: safeResolution,
      format: 'mp4',
      fps: 30,
    };
    await project.save();

    // Create persistent Export record in MongoDB
    const exportDoc = new Export({
      userId,
      clipId: clip._id,
      projectId: project._id,
      status: 'processing',
      format: 'mp4',
      resolution: safeResolution,
      aspectRatio: safeAspectRatio,
    });
    await exportDoc.save();

    // Queue export rendering job
    const job = jobQueue.addJob('render_export', {
      clipId: clip._id,
      userId,
      exportId: exportDoc._id,
      sourceVideoPath,
      options: {
        startTime: effectiveStart,
        endTime: effectiveEnd,
        aspectRatio: safeAspectRatio,
        resolution: safeResolution,
        filter: safeFilter,
        filterIntensity: safeFilterIntensity,
        adjustments,
        stickers,
        speed: Number(speed),
        volume: Number(volume),
        textOverlays,
        overlayMusic: overlayMusicConfig,
        transition,
        effect,
        soundEffects,
        voiceEffect,
        watermark,
        speedCurve,
      },
    });

    // Execute background worker asynchronously
    (async () => {
      try {
        jobQueue.updateJobProgress(job.id, 5, 'Rendering your clip...');

        const result = await exportService.renderClip(
          sourceVideoPath,
          {
            startTime: effectiveStart,
            endTime: effectiveEnd,
            aspectRatio: safeAspectRatio,
            resolution: safeResolution,
            filter: safeFilter,
            filterIntensity: safeFilterIntensity,
            adjustments,
            stickers,
            speed: Number(speed),
            volume: Number(volume),
            textOverlays,
            overlayMusic: overlayMusicConfig,
            transition,
            effect,
            soundEffects,
            voiceEffect,
            watermark,
            speedCurve,
            preset: safePreset,
          },
          (progress) => {
            jobQueue.updateJobProgress(job.id, progress, `Rendering your clip (${progress}%)...`);
          }
        );

        // Upload rendered output and thumbnail to storage service (user-isolated)
        const exportKey = StorageKeys.userExport(userId.toString(), exportDoc._id.toString(), result.outputFileName);
        await storageService.upload(exportKey, result.outputPath, 'video/mp4');

        let exportThumbKey = '';
        if (result.thumbnailPath && fs.existsSync(result.thumbnailPath)) {
          exportThumbKey = StorageKeys.userExport(userId.toString(), exportDoc._id.toString(), path.basename(result.thumbnailPath));
          await storageService.upload(exportThumbKey, result.thumbnailPath, 'image/jpeg');
        }

        const stat = fs.statSync(result.outputPath);
        exportDoc.status = 'completed';
        exportDoc.fileKey = exportKey;
        exportDoc.fileSize = stat.size;
        exportDoc.completedAt = new Date();
        await exportDoc.save();

        // Persist newly rendered video as a completed Clip in MongoDB so it is generated in My Clips library!
        const renderedClip = new Clip({
          userId: clip.userId,
          videoId: clip.videoId,
          title: `${clip.title} (Rendered ${safeAspectRatio})`,
          startTime: effectiveStart,
          endTime: effectiveEnd,
          duration: Math.max(1, parseFloat((effectiveEnd - effectiveStart).toFixed(1))),
          score: clip.score || 0.95,
          reason: `Exported ${safeResolution} ${safeAspectRatio} with ${safeFilter} filter`,
          filePath: result.outputPath,
          thumbnailPath: result.thumbnailPath,
          fileKey: exportKey,
          thumbnailKey: exportThumbKey || undefined,
          aspectRatio: safeAspectRatio,
          status: 'completed',
        });
        await renderedClip.save();

        // Increment clipCount on parent video
        await Video.updateOne({ _id: clip.videoId }, { $inc: { clipCount: 1 } });

        const signedOutputUrl = await storageService.getSignedUrl(exportKey);
        const signedThumbnailUrl = exportThumbKey
          ? await storageService.getSignedUrl(exportThumbKey)
          : `/api/media/stream/${path.basename(result.thumbnailPath)}`;

        jobQueue.completeJob(
          job.id,
          {
            exportId: exportDoc._id,
            clipId: renderedClip._id,
            clipTitle: renderedClip.title,
            outputUrl: signedOutputUrl,
            downloadUrl: `/api/export/download/${result.outputFileName}`,
            thumbnailUrl: signedThumbnailUrl,
            fileName: result.outputFileName,
          },
          'Your clip is ready.'
        );
      } catch (renderErr: any) {
        logger.error(`Export failed for job ${job.id}:`, renderErr);
        exportDoc.status = 'failed';
        exportDoc.error = renderErr.message || 'Export rendering failed.';
        await exportDoc.save();
        jobQueue.failJob(job.id, renderErr.message || 'Export rendering failed.');
      }
    })();

    res.status(202).json({
      success: true,
      message: 'Export job initiated.',
      jobId: job.id,
      exportId: exportDoc._id,
    });
  } catch (err) {
    next(err);
  }
};

export const getExportStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user!._id;
    const job = jobQueue.getJob(jobId);

    if (!job) {
      // Fallback: check database Export model
      const exportDoc = await Export.findOne({ _id: jobId, userId });
      if (exportDoc) {
        let signedUrl = '';
        if (exportDoc.fileKey) {
          signedUrl = await storageService.getSignedUrl(exportDoc.fileKey);
        }
        res.status(200).json({
          success: true,
          status: exportDoc.status,
          progress: exportDoc.status === 'completed' ? 100 : 0,
          result: {
            exportId: exportDoc._id,
            outputUrl: signedUrl,
          },
          error: exportDoc.error,
        });
        return;
      }

      res.status(404).json({ success: false, message: 'Export job not found.' });
      return;
    }

    // Ownership check on job
    if (job.data?.userId && job.data.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized access to export job.' });
      return;
    }

    res.status(200).json({
      success: true,
      status: job.status,
      progress: job.progress,
      message: job.message,
      result: job.result,
      error: job.error,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadExportedFile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileName } = req.params;
    // Security check: strictly validate filename to prevent path traversal
    const safeName = path.basename(fileName);
    const candidateDirs = [config.outputDir, config.uploadDir];
    let filePath: string | null = null;
    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, safeName);
      if (fs.existsSync(fullPath)) {
        filePath = fullPath;
        break;
      }
    }

    if (!filePath) {
      res.status(404).json({ success: false, message: 'File not found.' });
      return;
    }

    const stat = fs.statSync(filePath);
    res.setHeader('Content-Disposition', `attachment; filename="clipforge-${safeName}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
};

export const batchExportClips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { clipIds, commonEdits = {} } = req.body;

    if (!Array.isArray(clipIds) || clipIds.length === 0) {
      res.status(400).json({ success: false, message: 'Please provide an array of clipIds to export.' });
      return;
    }

    // Fetch and validate clips belonging to this user
    const clips = await Clip.find({ _id: { $in: clipIds }, userId });
    if (clips.length === 0) {
      res.status(404).json({ success: false, message: 'No valid clips found for batch export.' });
      return;
    }

    const {
      aspectRatio = '9:16',
      resolution = '1080p',
      filter = 'normal',
      filterIntensity = 100,
      adjustments = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, vignette: 0 },
      stickers = [],
      watermark,
      transition,
      effect,
      speed = 1.0,
      volume = 100,
    } = commonEdits;

    const validAspectRatios = ['9:16', '16:9', '1:1', '4:5', 'original'];
    const safeAspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original' = validAspectRatios.includes(aspectRatio)
      ? (aspectRatio as any)
      : '9:16';

    const validFilters = [
      'normal',
      'bright',
      'contrast',
      'cinematic',
      'warm',
      'cool',
      'vibrant',
      'vintage',
      'faded',
      'dramatic',
      'cyberpunk',
      'grayscale',
    ];
    const safeFilter: any = validFilters.includes(filter) ? filter : 'normal';
    const safeFilterIntensity = Math.max(0, Math.min(100, Number(filterIntensity) !== undefined && !isNaN(Number(filterIntensity)) ? Number(filterIntensity) : 100));

    const validResolutions = ['720p', '1080p', '4k'];
    const safeResolution: '720p' | '1080p' | '4k' = validResolutions.includes(resolution) ? resolution : '1080p';

    const validPresets = ['ultrafast', 'veryfast', 'fast'];
    const safePreset: 'ultrafast' | 'veryfast' | 'fast' = validPresets.includes(commonEdits.preset)
      ? commonEdits.preset
      : 'veryfast';

    // Build batch job items
    const batchClipItems = clips.map((c) => ({
      clipId: c._id.toString(),
      title: c.title,
      duration: c.duration,
      status: 'queued' as 'queued' | 'processing' | 'completed' | 'failed',
      progress: 0,
      result: undefined as any,
      error: undefined as string | undefined,
    }));

    const job = jobQueue.addJob('batch_export', {
      userId,
      totalClips: clips.length,
      clips: batchClipItems,
      commonEdits: {
        aspectRatio: safeAspectRatio,
        resolution: safeResolution,
        filter: safeFilter,
        filterIntensity: safeFilterIntensity,
        adjustments,
        stickers,
        watermark,
        transition,
        effect,
        speed: Number(speed) || 1.0,
        volume: Number(volume) || 100,
        preset: safePreset,
      },
    });

    // Run batch rendering in background with 2 concurrent workers for high-speed multi-core rendering
    (async () => {
      const completedItems: any[] = [];
      let failureCount = 0;
      let currentIndex = 0;
      const CONCURRENCY = Math.min(2, clips.length);

      const renderWorker = async () => {
        while (currentIndex < clips.length) {
          const i = currentIndex++;
          const clip = clips[i];
          const clipItem = batchClipItems[i];
          clipItem.status = 'processing';

          try {
            const video = await Video.findById(clip.videoId);
            const sourceVideoPath = clip.filePath && fs.existsSync(clip.filePath) ? clip.filePath : video?.filePath;

            if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
              throw new Error(`Source video file not found for clip "${clip.title}"`);
            }

            const effectiveStart = sourceVideoPath === clip.filePath ? 0 : clip.startTime;
            const effectiveEnd = sourceVideoPath === clip.filePath ? clip.duration : clip.endTime;

            const renderResult = await exportService.renderClip(
              sourceVideoPath,
              {
                startTime: effectiveStart,
                endTime: effectiveEnd,
                aspectRatio: safeAspectRatio,
                resolution: safeResolution,
                filter: safeFilter,
                filterIntensity: safeFilterIntensity,
                adjustments,
                stickers,
                watermark,
                transition,
                effect,
                speed: Number(speed) || 1.0,
                volume: Number(volume) || 100,
                preset: safePreset,
              },
              (clipPct) => {
                clipItem.progress = clipPct;
                const totalCompletedPct =
                  batchClipItems.reduce(
                    (acc, c) => acc + (c.status === 'completed' ? 100 : c.progress || 0),
                    0
                  ) / clips.length;
                jobQueue.updateJobProgress(
                  job.id,
                  Math.round(totalCompletedPct),
                  `Exporting "${clip.title}" (${clipPct}%)...`
                );
              }
            );

            // Upload to storageService
            const exportKey = StorageKeys.userExport(userId.toString(), clipItem.clipId, renderResult.outputFileName);
            await storageService.upload(exportKey, renderResult.outputPath, 'video/mp4');

            let exportThumbKey = '';
            if (renderResult.thumbnailPath && fs.existsSync(renderResult.thumbnailPath)) {
              exportThumbKey = StorageKeys.userExport(userId.toString(), clipItem.clipId, path.basename(renderResult.thumbnailPath));
              await storageService.upload(exportThumbKey, renderResult.thumbnailPath, 'image/jpeg');
            }

            // Save rendered clip to DB so it appears in My Clips
            const renderedClip = new Clip({
              userId: clip.userId,
              videoId: clip.videoId,
              title: `${clip.title} (Rendered ${safeAspectRatio})`,
              startTime: effectiveStart,
              endTime: effectiveEnd,
              duration: Math.max(1, parseFloat((effectiveEnd - effectiveStart).toFixed(1))),
              score: clip.score || 0.95,
              reason: `Batch exported ${safeResolution} ${safeAspectRatio} with ${safeFilter} filter`,
              filePath: renderResult.outputPath,
              thumbnailPath: renderResult.thumbnailPath,
              fileKey: exportKey,
              thumbnailKey: exportThumbKey || undefined,
              aspectRatio: safeAspectRatio,
              status: 'completed',
            });
            await renderedClip.save();
            if (clip.videoId) {
              await Video.updateOne({ _id: clip.videoId }, { $inc: { clipCount: 1 } });
            }

            const signedOutputUrl = await storageService.getSignedUrl(exportKey);
            const signedThumbnailUrl = exportThumbKey
              ? await storageService.getSignedUrl(exportThumbKey)
              : `/api/media/stream/${path.basename(renderResult.thumbnailPath)}`;

            const itemResult = {
              clipId: renderedClip._id,
              clipTitle: renderedClip.title,
              outputUrl: signedOutputUrl,
              downloadUrl: `/api/export/download/${renderResult.outputFileName}`,
              thumbnailUrl: signedThumbnailUrl,
              fileName: renderResult.outputFileName,
            };

            clipItem.status = 'completed';
            clipItem.progress = 100;
            clipItem.result = itemResult;
            completedItems.push(itemResult);
          } catch (clipErr: any) {
            logger.error(`Batch export error for clip ${clip._id}:`, clipErr);
            clipItem.status = 'failed';
            clipItem.error = clipErr.message || 'Export failed';
            failureCount++;
          }

          const totalCompletedPct =
            batchClipItems.reduce(
              (acc, c) => acc + (c.status === 'completed' ? 100 : c.progress || 0),
              0
            ) / clips.length;
          jobQueue.updateJobProgress(
            job.id,
            Math.round(totalCompletedPct),
            `Progress: ${completedItems.length}/${clips.length} clip(s) ready`
          );
        }
      };

      // Launch concurrent worker pool
      await Promise.all(Array.from({ length: CONCURRENCY }, () => renderWorker()));

      const totalCount = clips.length;
      const completedCount = completedItems.length;

      if (completedCount === 0) {
        jobQueue.failJob(job.id, 'All clips failed to export in batch.');
      } else {
        jobQueue.completeJob(
          job.id,
          {
            completedCount,
            failedCount: failureCount,
            totalCount,
            zipDownloadUrl: `/api/export/batch/${job.id}/zip`,
            items: completedItems,
            clips: batchClipItems,
          },
          `Batch export completed: ${completedCount}/${totalCount} clips exported successfully.`
        );
      }
    })();

    res.status(202).json({
      success: true,
      message: `Batch export initiated for ${clips.length} clip(s).`,
      batchId: job.id,
      jobId: job.id,
    });
  } catch (err) {
    next(err);
  }
};

export const getBatchExportStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { batchId } = req.params;
    const userId = req.user!._id;
    const job = jobQueue.getJob(batchId);

    if (!job) {
      res.status(404).json({ success: false, message: 'Batch export job not found.' });
      return;
    }

    if (job.data?.userId && job.data.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized access to batch job.' });
      return;
    }

    res.status(200).json({
      success: true,
      batchId: job.id,
      status: job.status,
      progress: job.progress,
      message: job.message,
      clips: job.data?.clips || [],
      result: job.result,
      error: job.error,
    });
  } catch (err) {
    next(err);
  }
};

export const downloadBatchZip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { batchId } = req.params;
    const userId = req.user!._id;
    const job = jobQueue.getJob(batchId);

    if (job && job.data?.userId && job.data.userId.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized access to batch job.' });
      return;
    }

    // Collect all completed file names
    let items = job?.result?.items || (job?.data?.clips || [])
      .filter((c: any) => c.status === 'completed' && c.result?.fileName)
      .map((c: any) => c.result);

    if (!items || items.length === 0) {
      // Fallback: Check outputs folder for recent renders
      try {
        const files = fs.readdirSync(config.outputDir)
          .filter((f) => (f.startsWith('render-') || f.startsWith('clip-')) && f.endsWith('.mp4'))
          .map((f) => ({
            fileName: f,
            clipTitle: f.replace('.mp4', ''),
            mtime: fs.statSync(path.join(config.outputDir, f)).mtimeMs,
          }))
          .sort((a, b) => b.mtime - a.mtime)
          .slice(0, 10);
        if (files.length > 0) {
          items = files;
        }
      } catch {}
    }

    if (!items || items.length === 0) {
      res.status(404).json({ success: false, message: 'No exported video clips found to package into ZIP.' });
      return;
    }

    const archiverModule: any = await import('archiver');
    let archive: any;
    if (typeof archiverModule === 'function') {
      archive = archiverModule('zip', { zlib: { level: 5 } });
    } else if (typeof archiverModule.default === 'function') {
      archive = archiverModule.default('zip', { zlib: { level: 5 } });
    } else if (archiverModule.ZipArchive) {
      archive = new archiverModule.ZipArchive({ zlib: { level: 5 } });
    } else if (archiverModule.default?.ZipArchive) {
      archive = new archiverModule.default.ZipArchive({ zlib: { level: 5 } });
    } else {
      throw new Error('Could not initialize ZIP archive engine.');
    }

    const safeBatchId = (batchId || 'bundle').slice(0, 8);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="clipforge-batch-${safeBatchId}.zip"`);

    archive.on('error', (err: any) => {
      logger.error('ZIP archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to generate ZIP archive.' });
      }
    });

    archive.pipe(res);

    const seen = new Set<string>();
    for (const item of items) {
      if (!item?.fileName || seen.has(item.fileName)) continue;
      seen.add(item.fileName);

      const filePath = path.join(config.outputDir, item.fileName);
      if (fs.existsSync(filePath)) {
        const safeTitle = (item.clipTitle || 'clip').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'clip';
        archive.file(filePath, { name: `${safeTitle}-${path.basename(filePath)}` });
      }
    }

    await archive.finalize();
  } catch (err) {
    next(err);
  }
};

