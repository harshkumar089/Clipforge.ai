import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';
import { Clip } from '../models/Clip.js';
import { Video } from '../models/Video.js';
import { Project } from '../models/Project.js';
import { deleteFileIfExists } from '../utils/fileHelpers.js';
import path from 'path';

import { storageService } from '../services/storage/StorageService.js';

export const getClips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { status, videoId } = req.query;

    const query: any = { userId };
    if (status && status !== 'all' && status !== 'undefined') {
      query.status = status;
    }
    if (videoId && videoId !== 'undefined' && mongoose.isValidObjectId(videoId)) {
      query.videoId = videoId;
    }

    const clips = await Clip.find(query).sort({ createdAt: -1 }).populate('videoId', 'title storageKey filePath');

    const formatted = await Promise.all(
      clips.map(async (c: any) => {
        let thumbnailUrl: string | null = null;
        if (c.thumbnailKey) {
          thumbnailUrl = await storageService.getSignedUrl(c.thumbnailKey);
        } else if (c.thumbnailPath) {
          thumbnailUrl = `/api/media/stream/${path.basename(c.thumbnailPath)}`;
        }

        let clipUrl: string | null = null;
        if (c.fileKey) {
          clipUrl = await storageService.getSignedUrl(c.fileKey);
        } else if (c.filePath) {
          clipUrl = `/api/media/stream/${path.basename(c.filePath)}`;
        }

        return {
          id: c._id,
          videoId: c.videoId?._id,
          videoTitle: c.videoId?.title || 'Original Video',
          title: c.title,
          startTime: c.startTime,
          endTime: c.endTime,
          duration: c.duration,
          score: c.score,
          reason: c.reason,
          aspectRatio: c.aspectRatio,
          status: c.status,
          thumbnailUrl,
          clipUrl,
          videoUrl: clipUrl,
          createdAt: c.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      clips: formatted,
    });
  } catch (err) {
    next(err);
  }
};

export const getClipById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: 'Clip not found.' });
      return;
    }

    const clip = await Clip.findOne({ _id: id, userId }).populate('videoId');
    if (!clip) {
      res.status(404).json({ success: false, message: 'Clip not found.' });
      return;
    }

    // Get or initialize project settings for this clip
    let project = await Project.findOne({ clipId: clip._id, userId });
    if (!project) {
      project = new Project({
        userId,
        videoId: clip.videoId._id,
        clipId: clip._id,
        edits: {
          startTime: clip.startTime,
          endTime: clip.endTime,
          aspectRatio: clip.aspectRatio || '9:16',
          filter: 'normal',
          speed: 1.0,
          volume: 100,
          textOverlays: [],
        },
      });
      await project.save();
    }

    let thumbnailUrl: string | null = null;
    if (clip.thumbnailKey) {
      thumbnailUrl = await storageService.getSignedUrl(clip.thumbnailKey);
    } else if (clip.thumbnailPath) {
      thumbnailUrl = `/api/media/stream/${path.basename(clip.thumbnailPath)}`;
    }

    let clipUrl: string | null = null;
    if (clip.fileKey) {
      clipUrl = await storageService.getSignedUrl(clip.fileKey);
    } else if (clip.filePath) {
      clipUrl = `/api/media/stream/${path.basename(clip.filePath)}`;
    }

    let videoUrl: string | null = null;
    const parentVideo = clip.videoId as any;
    if (parentVideo?.storageKey) {
      videoUrl = await storageService.getSignedUrl(parentVideo.storageKey);
    } else if (parentVideo?.filePath) {
      videoUrl = `/api/media/stream/${path.basename(parentVideo.filePath)}`;
    }

    res.status(200).json({
      success: true,
      clip: {
        id: clip._id,
        videoId: parentVideo?._id,
        videoTitle: parentVideo?.title,
        videoUrl: videoUrl || clipUrl,
        title: clip.title,
        startTime: clip.startTime,
        endTime: clip.endTime,
        duration: clip.duration,
        score: clip.score,
        reason: clip.reason,
        aspectRatio: clip.aspectRatio,
        status: clip.status,
        thumbnailUrl,
        clipUrl,
        createdAt: clip.createdAt,
      },
      project: {
        id: project._id,
        edits: project.edits,
        exportSettings: project.exportSettings,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateClip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { title, aspectRatio } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: 'Clip not found.' });
      return;
    }

    const clip = await Clip.findOne({ _id: id, userId });
    if (!clip) {
      res.status(404).json({ success: false, message: 'Clip not found.' });
      return;
    }

    if (title) clip.title = title;
    if (aspectRatio) clip.aspectRatio = aspectRatio;

    await clip.save();

    res.status(200).json({
      success: true,
      message: 'Clip updated successfully.',
      clip,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteClip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: 'Clip not found.' });
      return;
    }

    const clip = await Clip.findOne({ _id: id, userId });
    if (!clip) {
      res.status(404).json({ success: false, message: 'Clip not found.' });
      return;
    }

    if (clip.fileKey) {
      await storageService.delete(clip.fileKey).catch(() => {});
    }
    if (clip.thumbnailKey) {
      await storageService.delete(clip.thumbnailKey).catch(() => {});
    }
    if (clip.filePath) deleteFileIfExists(clip.filePath);
    if (clip.thumbnailPath) deleteFileIfExists(clip.thumbnailPath);

    await Clip.deleteOne({ _id: clip._id });
    await Project.deleteMany({ clipId: clip._id });

    // Decrement clip count on parent video
    await Video.updateOne({ _id: clip.videoId }, { $inc: { clipCount: -1 } });

    res.status(200).json({
      success: true,
      message: 'Clip deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};


