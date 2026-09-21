import path from 'path';
import mongoose from 'mongoose';
import { Video, IVideo } from '../models/Video.js';
import { Clip, IClip } from '../models/Clip.js';
import { clipAnalyzer, AnalyzeOptions } from './ClipAnalyzer.js';
import { ffmpegService } from './FFmpegService.js';
import { thumbnailService } from './ThumbnailService.js';
import { storageService, StorageKeys } from './storage/StorageService.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class ClipGenerationService {
  public async generateClipsForVideo(
    video: IVideo,
    options: AnalyzeOptions = {}
  ): Promise<IClip[]> {
    logger.info(`Starting clip generation for video: ${video._id} (${video.title})`);

    if (!video.filePath) {
      throw new Error(`Video file path not found for video ${video._id}`);
    }

    // 1. Analyze video to discover peak moments
    const candidates = await clipAnalyzer.analyze(video.filePath, video.duration, options);
    logger.info(`Discovered ${candidates.length} highlight moments for video ${video._id}`);

    const createdClips: IClip[] = [];

    // 2. Extract each candidate segment into a standalone video file
    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      const clipDuration = cand.endTime - cand.startTime;
      const clipFileName = `clip-${video._id}-${i + 1}-${uuidv4().substring(0, 6)}.mp4`;
      const clipFilePath = path.join(config.outputDir, clipFileName);

      try {
        // Fast trim to extract the clip segment
        await ffmpegService.trimVideo(
          video.filePath,
          cand.startTime,
          clipDuration,
          clipFilePath
        );

        // Generate thumbnail for this specific clip
        const thumbPath = await thumbnailService.generateThumbnail(
          clipFilePath,
          Math.min(1, clipDuration / 2)
        );

        const clipId = new mongoose.Types.ObjectId();
        const fileKey = StorageKeys.userClip(video.userId.toString(), clipId.toString(), clipFileName);
        await storageService.upload(fileKey, clipFilePath, 'video/mp4');

        let thumbnailKey = '';
        if (thumbPath) {
          thumbnailKey = StorageKeys.userThumbnail(video.userId.toString(), clipId.toString());
          await storageService.upload(thumbnailKey, thumbPath, 'image/jpeg');
        }

        const clip = new Clip({
          _id: clipId,
          userId: video.userId,
          videoId: video._id,
          title: `${video.title} - Clip #${i + 1}`,
          startTime: cand.startTime,
          endTime: cand.endTime,
          duration: clipDuration,
          score: cand.score,
          reason: cand.reason,
          fileKey,
          thumbnailKey,
          filePath: clipFilePath,
          thumbnailPath: thumbPath,
          aspectRatio: '9:16',
          status: 'completed',
        });

        await clip.save();
        createdClips.push(clip);
      } catch (err: any) {
        logger.error(`Failed to extract clip ${i + 1} for video ${video._id}:`, err.message);
      }
    }

    // 3. Update the parent video
    video.clipCount = createdClips.length;
    video.status = 'completed';
    await video.save();

    logger.info(`Successfully generated ${createdClips.length} clips for video ${video._id}`);
    return createdClips;
  }
}

export const clipGenerationService = new ClipGenerationService();
