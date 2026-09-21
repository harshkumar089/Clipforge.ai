import multer from 'multer';
import path from 'path';
import { config } from '../config/environment.js';
import { sanitizeFileName } from '../utils/fileHelpers.js';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = sanitizeFileName(path.basename(file.originalname, ext));
    cb(null, `audio-${base}-${Date.now()}-${uuidv4().substring(0, 6)}${ext}`);
  },
});

const allowedMimeTypes = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mp4',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
];

const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported audio format. Please upload an MP3, WAV, M4A, AAC, or OGG file.'));
  }
};

export const uploadAudioMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter,
});
