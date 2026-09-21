import multer from 'multer';
import path from 'path';
import { config } from '../config/environment.js';
import { sanitizeFileName } from '../utils/fileHelpers.js';
import { v4 as uuidv4 } from 'uuid';

import fs from 'fs';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = sanitizeFileName(path.basename(file.originalname, ext));
    cb(null, `${base}-${Date.now()}-${uuidv4().substring(0, 6)}${ext}`);
  },
});

const allowedExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.ts', '.flv', '.wmv', '.3gp', '.mpeg', '.mpg'];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype?.startsWith('video/') || allowedExtensions.includes(ext) || file.mimetype === 'application/octet-stream') {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format (${ext}). Please upload an MP4, MOV, WebM, AVI, or MKV file.`));
  }
};

export const uploadVideoMiddleware = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize, // 500MB
  },
  fileFilter,
});
