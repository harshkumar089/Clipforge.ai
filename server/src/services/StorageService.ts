import path from 'path';
import fs from 'fs';
import { config } from '../config/environment.js';
import { ensureDirExists, sanitizeFileName } from '../utils/fileHelpers.js';
import { v4 as uuidv4 } from 'uuid';

export interface IStorageService {
  saveUploadedFile(originalName: string, buffer: Buffer): Promise<{ filePath: string; fileName: string }>;
  getPublicUrl(relativePath: string): string;
  deleteFile(filePath: string): Promise<void>;
  getUploadsPath(): string;
  getOutputsPath(): string;
  getThumbnailsPath(): string;
}

export class LocalStorageService implements IStorageService {
  constructor() {
    ensureDirExists(config.uploadDir);
    ensureDirExists(config.outputDir);
    ensureDirExists(config.thumbnailDir);
  }

  public getUploadsPath(): string {
    return config.uploadDir;
  }

  public getOutputsPath(): string {
    return config.outputDir;
  }

  public getThumbnailsPath(): string {
    return config.thumbnailDir;
  }

  public async saveUploadedFile(originalName: string, buffer: Buffer): Promise<{ filePath: string; fileName: string }> {
    const ext = path.extname(originalName).toLowerCase();
    const cleanName = sanitizeFileName(path.basename(originalName, ext));
    const uniqueFileName = `${cleanName}-${uuidv4().substring(0, 8)}${ext}`;
    const destination = path.join(config.uploadDir, uniqueFileName);

    await fs.promises.writeFile(destination, buffer);
    return {
      filePath: destination,
      fileName: uniqueFileName,
    };
  }

  public getPublicUrl(fileNameOrRelPath: string): string {
    const base = path.basename(fileNameOrRelPath);
    return `/api/media/stream/${base}`;
  }

  public async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.error(`Failed to remove file ${filePath}:`, err);
    }
  }
}

export const storageService = new LocalStorageService();
