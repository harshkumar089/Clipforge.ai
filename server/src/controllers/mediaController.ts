import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from '../config/environment.js';
import { storageService } from '../services/storage/StorageService.js';

export const streamMediaFile = async (req: Request, res: Response): Promise<void> => {
  // Can be provided via query param `?key=...` or route param `:fileName`
  const rawKey = (req.query.key as string) || req.params.fileName;

  if (!rawKey) {
    res.status(400).json({ success: false, message: 'No media key or filename provided.' });
    return;
  }

  // Prevent directory traversal attacks
  const safeKey = rawKey.replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');

  let targetPath: string | null = null;

  // 1. Check via StorageService
  const storageLocalPath = storageService.getLocalPath(safeKey);
  if (fs.existsSync(storageLocalPath)) {
    targetPath = storageLocalPath;
  } else {
    // 2. Fallback check for legacy flat filenames in candidateDirs
    const baseName = path.basename(safeKey);
    const candidateDirs = [config.outputDir, config.uploadDir, config.thumbnailDir];
    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, baseName);
      if (fs.existsSync(fullPath)) {
        targetPath = fullPath;
        break;
      }
    }
  }

  if (!targetPath || !fs.existsSync(targetPath)) {
    res.status(404).json({ success: false, message: 'Media file not found.' });
    return;
  }

  const stat = fs.statSync(targetPath);
  const fileSize = stat.size;
  const ext = path.extname(targetPath).toLowerCase();

  let contentType = 'video/mp4';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.webm') contentType = 'video/webm';
  else if (ext === '.mov') contentType = 'video/quicktime';
  else if (ext === '.mp3') contentType = 'audio/mpeg';
  else if (ext === '.wav') contentType = 'audio/wav';
  else if (ext === '.m4a' || ext === '.aac') contentType = 'audio/aac';
  else if (ext === '.ogg') contentType = 'audio/ogg';
  else if (ext === '.flac') contentType = 'audio/flac';

  const range = req.headers.range;
  const isDownload = req.query.download === 'true' || req.query.download === '1';
  const downloadHeaders: Record<string, string> = isDownload
    ? { 'Content-Disposition': `attachment; filename="clipforge-${path.basename(targetPath)}"` }
    : {};

  if (range && (contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
    // 206 Partial Content for streaming
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fileStream = fs.createReadStream(targetPath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      ...downloadHeaders,
    });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      ...downloadHeaders,
    });
    fs.createReadStream(targetPath).pipe(res);
  }
};
