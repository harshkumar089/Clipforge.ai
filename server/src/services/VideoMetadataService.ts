import { execFile } from 'child_process';
import util from 'util';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const execFileAsync = util.promisify(execFile);

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  aspectRatio: string;
  videoCodec: string;
  audioCodec?: string;
  fps: number;
  bitrate: number;
  size: number;
  hasAudio: boolean;
}

export class VideoMetadataService {
  public async getMetadata(filePath: string): Promise<VideoMetadata> {
    try {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath,
      ];

      const { stdout } = await execFileAsync(config.ffprobePath, args);
      const data = JSON.parse(stdout);

      const videoStream = data.streams?.find((s: any) => s.codec_type === 'video') || {};
      const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');

      const duration = parseFloat(data.format?.duration || videoStream.duration || '0');
      const width = parseInt(videoStream.width || '1280', 10);
      const height = parseInt(videoStream.height || '720', 10);

      // Parse fps
      let fps = 30;
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
        if (num && den) fps = Math.round(num / den);
      }

      const bitrate = parseInt(data.format?.bit_rate || videoStream.bit_rate || '0', 10);
      const size = parseInt(data.format?.size || '0', 10);

      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      const aspectRatio = `${width / divisor}:${height / divisor}`;

      return {
        duration,
        width,
        height,
        aspectRatio,
        videoCodec: videoStream.codec_name || 'unknown',
        audioCodec: audioStream?.codec_name,
        fps,
        bitrate,
        size,
        hasAudio: !!audioStream,
      };
    } catch (err: any) {
      logger.error('Error extracting video metadata with ffprobe:', err.message);
      throw new Error(`Failed to extract video metadata: ${err.message}`);
    }
  }

  public validateDuration(duration: number): { valid: boolean; message?: string } {
    if (duration <= 0) {
      return { valid: false, message: 'Invalid video file or corrupted stream.' };
    }
    if (duration > config.maxVideoDuration) {
      const maxMins = Math.round(config.maxVideoDuration / 60);
      return {
        valid: false,
        message: `Maximum video duration is ${maxMins} minutes (${config.maxVideoDuration} seconds). Your video is ${Math.round(duration)} seconds.`,
      };
    }
    return { valid: true };
  }
}

export const videoMetadataService = new VideoMetadataService();
