import path from 'path';
import { ffmpegService, RenderOptions } from './FFmpegService.js';
import { thumbnailService } from './ThumbnailService.js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface ExportResult {
  outputPath: string;
  outputFileName: string;
  thumbnailPath: string;
}

export class ExportService {
  public async renderClip(
    inputVideoPath: string,
    options: RenderOptions,
    onProgress?: (progress: number) => void
  ): Promise<ExportResult> {
    const outputFileName = `render-${uuidv4().substring(0, 8)}.mp4`;
    const outputPath = path.join(config.outputDir, outputFileName);

    logger.info(`ExportService: Rendering ${inputVideoPath} to ${outputPath}`);

    await ffmpegService.exportVideo(inputVideoPath, outputPath, {
      ...options,
      onProgress,
    });

    const thumbnailPath = await thumbnailService.generateThumbnail(outputPath, 0.5);

    return {
      outputPath,
      outputFileName,
      thumbnailPath,
    };
  }
}

export const exportService = new ExportService();
