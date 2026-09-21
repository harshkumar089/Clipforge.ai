import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';
import { Project } from '../models/Project.js';
import { Clip } from '../models/Clip.js';
import { Video } from '../models/Video.js';
import { logger } from '../utils/logger.js';

/**
 * List all projects belonging to the authenticated user
 */
export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;

    const projects = await Project.find({ userId })
      .sort({ updatedAt: -1 })
      .populate('videoId', 'title originalFileName duration storageKey')
      .populate('clipId', 'title startTime endTime duration aspectRatio fileKey thumbnailKey status');

    res.status(200).json({
      success: true,
      projects: projects.map((p) => ({
        id: p._id,
        name: p.name || 'Untitled Project',
        videoId: (p.videoId as any)?._id,
        videoTitle: (p.videoId as any)?.title || 'Original Video',
        clipId: (p.clipId as any)?._id,
        clipTitle: (p.clipId as any)?.title || 'Clip',
        clipStatus: (p.clipId as any)?.status || 'completed',
        aspectRatio: p.edits?.aspectRatio || (p.clipId as any)?.aspectRatio || '9:16',
        textOverlaysCount: p.edits?.textOverlays?.length || 0,
        edits: p.edits,
        exportSettings: p.exportSettings,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get project by ID with strict ownership verification
 */
export const getProjectById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const project = await Project.findOne({ _id: id, userId })
      .populate('videoId')
      .populate('clipId');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      project: {
        id: project._id,
        name: project.name,
        videoId: (project.videoId as any)?._id,
        videoTitle: (project.videoId as any)?.title,
        clipId: (project.clipId as any)?._id,
        clipTitle: (project.clipId as any)?.title,
        edits: project.edits,
        exportSettings: project.exportSettings,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get or initialize project for a specific clip
 */
export const getProjectByClipId = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clipId } = req.params;
    const userId = req.user!._id;

    if (!mongoose.isValidObjectId(clipId)) {
      res.status(404).json({ success: false, message: 'Invalid clip ID.' });
      return;
    }

    // Verify user owns the clip
    const clip = await Clip.findOne({ _id: clipId, userId }).populate('videoId');
    if (!clip) {
      res.status(404).json({ success: false, message: 'Clip not found or access denied.' });
      return;
    }

    let project = await Project.findOne({ clipId, userId });
    if (!project) {
      project = new Project({
        userId,
        videoId: clip.videoId._id,
        clipId: clip._id,
        name: `${clip.title} Project`,
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

    res.status(200).json({
      success: true,
      project: {
        id: project._id,
        name: project.name,
        videoId: clip.videoId._id,
        clipId: clip._id,
        edits: project.edits,
        exportSettings: project.exportSettings,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Save / update project settings (Autosave endpoint)
 */
export const saveProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { id } = req.params; // optional project id or in body
    const { clipId, videoId, name, edits, exportSettings } = req.body;

    let project: any;

    if (id && mongoose.isValidObjectId(id)) {
      // Find existing by project ID and verify ownership
      project = await Project.findOne({ _id: id, userId });
      if (!project) {
        res.status(404).json({ success: false, message: 'Project not found or access denied.' });
        return;
      }
    } else if (clipId && mongoose.isValidObjectId(clipId)) {
      // Find existing or create for clip
      const clip = await Clip.findOne({ _id: clipId, userId });
      if (!clip) {
        res.status(404).json({ success: false, message: 'Clip not found or access denied.' });
        return;
      }

      project = await Project.findOne({ clipId, userId });
      if (!project) {
        project = new Project({
          userId,
          videoId: clip.videoId,
          clipId: clip._id,
          name: name || `${clip.title} Project`,
        });
      }
    } else {
      res.status(400).json({ success: false, message: 'clipId or project ID required.' });
      return;
    }

    if (name) project.name = name;
    if (edits) {
      project.edits = {
        ...project.edits?.toObject?.() || {},
        ...edits,
      };
    }
    if (exportSettings) {
      project.exportSettings = {
        ...project.exportSettings?.toObject?.() || {},
        ...exportSettings,
      };
    }

    project.updatedAt = new Date();
    await project.save();

    logger.debug(`[Project] Autosaved project ${project._id} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Project saved successfully.',
      project: {
        id: project._id,
        name: project.name,
        clipId: project.clipId,
        videoId: project.videoId,
        edits: project.edits,
        exportSettings: project.exportSettings,
        updatedAt: project.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete project with ownership verification
 */
export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const project = await Project.findOneAndDelete({ _id: id, userId });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found or access denied.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
