import { execFile } from 'child_process';
import util from 'util';
import path from 'path';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const execFileAsync = util.promisify(execFile);

export class ThumbnailService {
  public async generateThumbnail(videoPath: string, timestampSeconds = 1): Promise<string> {
    const thumbName = `thumb-${uuidv4().substring(0, 8)}.jpg`;
    const outputPath = path.join(config.thumbnailDir, thumbName);

    try {
      const args = [
        '-y',
        '-ss', timestampSeconds.toString(),
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '2',
        '-vf', 'scale=640:-1',
        outputPath,
      ];

      await execFileAsync(config.ffmpegPath, args);
      return outputPath;
    } catch (err: any) {
      logger.error('Error generating thumbnail:', err.message);
      // Fallback: try capturing frame 0 if timestamp was beyond duration
      try {
        const fallbackArgs = [
          '-y',
          '-ss', '0',
          '-i', videoPath,
          '-vframes', '1',
          '-q:v', '3',
          '-vf', 'scale=640:-1',
          outputPath,
        ];
        await execFileAsync(config.ffmpegPath, fallbackArgs);
        return outputPath;
      } catch (fallbackErr: any) {
        logger.error('Fallback thumbnail generation failed:', fallbackErr.message);
        return '';
      }
    }
  }
}

export const thumbnailService = new ThumbnailService();
