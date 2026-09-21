import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Video } from '../models/Video.js';
import { Clip } from '../models/Clip.js';
import { videoMetadataService } from '../services/VideoMetadataService.js';
import { thumbnailService } from '../services/ThumbnailService.js';
import { clipAnalyzer } from '../services/ClipAnalyzer.js';
import { clipGenerationService } from '../services/ClipGenerationService.js';
import { jobQueue } from '../jobs/JobQueue.js';
import { deleteFileIfExists } from '../utils/fileHelpers.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

import mongoose from 'mongoose';
import { storageService, StorageKeys } from '../services/storage/StorageService.js';

export const uploadVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No video file provided.' });
      return;
    }

    const file = req.file;
    const userId = req.user!._id;

    logger.info(`Processing uploaded file: ${file.originalname} (${file.size} bytes) for user ${userId}`);

    // 1. Inspect metadata with ffprobe
    let metadata;
    try {
      metadata = await videoMetadataService.getMetadata(file.path);
    } catch (metaErr: any) {
      deleteFileIfExists(file.path);
      res.status(400).json({
        success: false,
        message: 'Could not read video metadata. The file may be corrupt or an unsupported format.',
      });
      return;
    }

    // 2. Validate duration (<= 4 hours / 14400 seconds)
    const durationCheck = videoMetadataService.validateDuration(metadata.duration);
    if (!durationCheck.valid) {
      deleteFileIfExists(file.path);
      res.status(400).json({
        success: false,
        message: durationCheck.message || 'Maximum video duration exceeded.',
      });
      return;
    }

    const videoId = new mongoose.Types.ObjectId();

    // 3. Upload video to user-isolated persistent storage
    const storageKey = StorageKeys.userVideo(userId.toString(), videoId.toString(), file.originalname);
    await storageService.upload(storageKey, file.path, file.mimetype || 'video/mp4');

    // 4. Generate thumbnail and upload to storage
    const thumbTimestamp = Math.min(2, Math.max(0.5, metadata.duration / 4));
    const thumbPath = await thumbnailService.generateThumbnail(file.path, thumbTimestamp);
    let thumbnailKey = '';
    if (thumbPath) {
      thumbnailKey = StorageKeys.userThumbnail(userId.toString(), videoId.toString());
      await storageService.upload(thumbnailKey, thumbPath, 'image/jpeg');
    }

    // 5. Save video record in MongoDB
    const title = req.body.title || path.basename(file.originalname, path.extname(file.originalname));

    const video = new Video({
      _id: videoId,
      userId,
      title,
      originalFileName: file.originalname,
      storageKey,
      thumbnailKey,
      filePath: file.path,
      thumbnailPath: thumbPath,
      duration: metadata.duration,
      fileSize: file.size,
      mimeType: file.mimetype || 'video/mp4',
      status: 'pending',
      metadata: {
        width: metadata.width,
        height: metadata.height,
        codec: metadata.videoCodec,
        fps: metadata.fps,
        bitrate: metadata.bitrate,
        hasAudio: metadata.hasAudio,
      },
    });

    await video.save();

    const signedThumbUrl = thumbnailKey ? await storageService.getSignedUrl(thumbnailKey) : null;

    res.status(201).json({
      success: true,
      message: 'Video uploaded and validated successfully.',
      video: {
        id: video._id,
        title: video.title,
        originalFileName: video.originalFileName,
        duration: video.duration,
        fileSize: video.fileSize,
        thumbnailUrl: signedThumbUrl,
        status: video.status,
        createdAt: video.createdAt,
      },
    });
  } catch (err) {
    if (req.file) {
      deleteFileIfExists(req.file.path);
    }
    next(err);
  }
};

export const getVideos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const videos = await Video.find({ userId }).sort({ createdAt: -1 });

    const formatted = await Promise.all(
      videos.map(async (v) => {
        let thumbnailUrl: string | null = null;
        if (v.thumbnailKey) {
          thumbnailUrl = await storageService.getSignedUrl(v.thumbnailKey);
        } else if (v.thumbnailPath) {
          thumbnailUrl = `/api/media/stream/${path.basename(v.thumbnailPath)}`;
        }

        return {
          id: v._id,
          title: v.title,
          originalFileName: v.originalFileName,
          duration: v.duration,
          fileSize: v.fileSize,
          thumbnailUrl,
          status: v.status,
          clipCount: v.clipCount,
          createdAt: v.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      videos: formatted,
    });
  } catch (err) {
    next(err);
  }
};

export const getVideoById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      res.status(404).json({ success: false, message: 'Video not found.' });
      return;
    }

    const clips = await Clip.find({ videoId: video._id, userId }).sort({ startTime: 1 });

    const videoUrl = video.storageKey
      ? await storageService.getSignedUrl(video.storageKey)
      : `/api/media/stream/${path.basename(video.filePath || '')}`;

    const videoThumbUrl = video.thumbnailKey
      ? await storageService.getSignedUrl(video.thumbnailKey)
      : (video.thumbnailPath ? `/api/media/stream/${path.basename(video.thumbnailPath)}` : null);

    const formattedClips = await Promise.all(
      clips.map(async (c) => ({
        id: c._id,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        duration: c.duration,
        score: c.score,
        reason: c.reason,
        thumbnailUrl: c.thumbnailKey
          ? await storageService.getSignedUrl(c.thumbnailKey)
          : (c.thumbnailPath ? `/api/media/stream/${path.basename(c.thumbnailPath)}` : null),
        clipUrl: c.fileKey
          ? await storageService.getSignedUrl(c.fileKey)
          : (c.filePath ? `/api/media/stream/${path.basename(c.filePath)}` : null),
        aspectRatio: c.aspectRatio,
        status: c.status,
      }))
    );

    res.status(200).json({
      success: true,
      video: {
        id: video._id,
        title: video.title,
        originalFileName: video.originalFileName,
        duration: video.duration,
        fileSize: video.fileSize,
        thumbnailUrl: videoThumbUrl,
        videoUrl,
        status: video.status,
        clipCount: video.clipCount,
        metadata: video.metadata,
        createdAt: video.createdAt,
      },
      clips: formattedClips,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      res.status(404).json({ success: false, message: 'Video not found.' });
      return;
    }

    // Delete associated clips from storage and database
    const clips = await Clip.find({ videoId: video._id, userId });
    for (const clip of clips) {
      if (clip.fileKey) await storageService.delete(clip.fileKey).catch(() => {});
      if (clip.thumbnailKey) await storageService.delete(clip.thumbnailKey).catch(() => {});
      if (clip.filePath) deleteFileIfExists(clip.filePath);
      if (clip.thumbnailPath) deleteFileIfExists(clip.thumbnailPath);
    }
    await Clip.deleteMany({ videoId: video._id, userId });

    // Delete video files from storage
    if (video.storageKey) await storageService.delete(video.storageKey).catch(() => {});
    if (video.thumbnailKey) await storageService.delete(video.thumbnailKey).catch(() => {});
    if (video.filePath) deleteFileIfExists(video.filePath);
    if (video.thumbnailPath) deleteFileIfExists(video.thumbnailPath);

    await Video.deleteOne({ _id: video._id, userId });

    res.status(200).json({
      success: true,
      message: 'Video and generated clips deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const analyzeVideo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      res.status(404).json({ success: false, message: 'Video not found.' });
      return;
    }

    if (!video.filePath || !fs.existsSync(video.filePath)) {
      res.status(400).json({ success: false, message: 'Video file is not available locally for analysis.' });
      return;
    }

    const { targetClipDuration = 15, numberOfClips = 3 } = req.body;

    const candidateMoments = await clipAnalyzer.analyze(video.filePath, video.duration, {
      targetClipDuration: Number(targetClipDuration),
      numberOfClips: Number(numberOfClips),
    });

    res.status(200).json({
      success: true,
      moments: candidateMoments,
    });
  } catch (err) {
    next(err);
  }
};

export const generateClips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      res.status(404).json({ success: false, message: 'Video not found.' });
      return;
    }

    const { targetClipDuration = 15, numberOfClips = 3 } = req.body;

    video.status = 'analyzing';
    await video.save();

    // Create background processing job
    const job = jobQueue.addJob('analyze_and_clip', {
      videoId: video._id,
      userId,
      targetClipDuration: Number(targetClipDuration),
      numberOfClips: Number(numberOfClips),
    });

    // Execute background worker asynchronously
    (async () => {
      try {
        jobQueue.updateJobProgress(job.id, 15, 'Analyzing your video...');
        await new Promise((r) => setTimeout(r, 600));

        jobQueue.updateJobProgress(job.id, 45, 'Finding interesting moments...');
        await new Promise((r) => setTimeout(r, 600));

        jobQueue.updateJobProgress(job.id, 70, 'Creating clips...');

        const createdClips = await clipGenerationService.generateClipsForVideo(video, {
          targetClipDuration: Number(targetClipDuration),
          numberOfClips: Number(numberOfClips),
        });

        jobQueue.completeJob(
          job.id,
          {
            clipCount: createdClips.length,
            clips: createdClips.map((c) => ({
              id: c._id,
              title: c.title,
              duration: c.duration,
              score: c.score,
              reason: c.reason,
            })),
          },
          'Your clips are ready!'
        );
      } catch (procErr: any) {
        logger.error(`Error processing job ${job.id}:`, procErr);
        jobQueue.failJob(job.id, procErr.message || 'Video processing failed.');
        video.status = 'failed';
        video.errorMessage = procErr.message;
        await video.save();
      }
    })();

    res.status(202).json({
      success: true,
      message: 'Video clipping job enqueued.',
      jobId: job.id,
    });
  } catch (err) {
    next(err);
  }
};

export const getProcessingStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // videoId or jobId
    const job = jobQueue.getJob(id);

    if (!job) {
      // If not found as jobId, check if video status has completed
      const video = await Video.findById(id);
      if (video) {
        if (video.status === 'completed') {
          const clips = await Clip.find({ videoId: video._id });
          res.status(200).json({
            success: true,
            status: 'completed',
            progress: 100,
            message: 'Your clips are ready!',
            result: { clipCount: clips.length },
          });
          return;
        }
        res.status(200).json({
          success: true,
          status: video.status,
          progress: video.status === 'analyzing' ? 50 : 0,
          message: video.status === 'analyzing' ? 'Processing video...' : 'Pending',
        });
        return;
      }
      res.status(404).json({ success: false, message: 'Processing job not found.' });
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
