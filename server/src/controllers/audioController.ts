import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import path from 'path';
import { execFile } from 'child_process';
import util from 'util';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const execFileAsync = util.promisify(execFile);

export const uploadAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No audio file provided.' });
      return;
    }

    const filePath = req.file.path;
    let duration = 30; // fallback default

    try {
      const probeArgs = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath,
      ];
      const { stdout } = await execFileAsync(config.ffprobePath, probeArgs);
      const data = JSON.parse(stdout);
      const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');
      duration = parseFloat(data.format?.duration || audioStream?.duration || '30');
    } catch (probeErr: any) {
      logger.warn(`Could not probe audio duration: ${probeErr.message}`);
    }

    const streamUrl = `/api/media/stream/${req.file.filename}`;

    res.status(200).json({
      success: true,
      audio: {
        url: streamUrl,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        duration: Math.round(duration * 100) / 100,
        size: req.file.size,
      },
    });
  } catch (error: any) {
    logger.error('Audio upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Audio upload failed.' });
  }
};

export const getAudioPresets = (req: AuthRequest, res: Response): void => {
  const presets = [
    {
      id: 'preset-lofi-chill',
      title: 'Lo-Fi Chill Chords',
      artist: 'ClipForge Originals',
      genre: 'Lo-Fi / Relaxed',
      duration: 30,
      fileName: 'preset-lofi-chill.mp3',
      url: '/api/media/stream/preset-lofi-chill.mp3',
      tag: 'CHILL',
    },
    {
      id: 'preset-ambient-glow',
      title: 'Ambient Glow Atmospheric',
      artist: 'ClipForge Originals',
      genre: 'Cinematic / Drone',
      duration: 30,
      fileName: 'preset-ambient-glow.mp3',
      url: '/api/media/stream/preset-ambient-glow.mp3',
      tag: 'CINEMATIC',
    },
    {
      id: 'preset-upbeat-pop',
      title: 'Upbeat Kinetic Pop',
      artist: 'ClipForge Originals',
      genre: 'Energetic / Beat',
      duration: 30,
      fileName: 'preset-upbeat-pop.mp3',
      url: '/api/media/stream/preset-upbeat-pop.mp3',
      tag: 'UPBEAT',
    },
  ];

  res.status(200).json({ success: true, presets });
};
