import { execFile } from 'child_process';
import util from 'util';
import os from 'os';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const execFileAsync = util.promisify(execFile);
const NULL_DEVICE = os.platform() === 'win32' ? 'NUL' : '/dev/null';

export interface CandidateClip {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
}

export interface AnalyzeOptions {
  targetClipDuration?: number; // 10, 15, 20, 30
  numberOfClips?: number; // 1, 3, 5, 10
  minDuration?: number;
  maxDuration?: number;
}

export interface IClipAnalyzer {
  analyze(videoPath: string, totalDuration: number, options?: AnalyzeOptions): Promise<CandidateClip[]>;
}

export class HeuristicClipAnalyzer implements IClipAnalyzer {
  public async analyze(
    videoPath: string,
    totalDuration: number,
    options: AnalyzeOptions = {}
  ): Promise<CandidateClip[]> {
    const rawTargetDuration = options.targetClipDuration || 15;
    const requestedCount = options.numberOfClips || 3;
    const duration = Math.max(1, totalDuration);

    // Effective clip duration adapted to source length
    const targetDuration = Math.min(rawTargetDuration, Math.max(3, duration));

    logger.info(`Analyzing video ${videoPath} (${duration}s) for ${requestedCount} clips of ~${targetDuration}s`);

    // 1. Detect scene changes and audio silence with fast downscaled pass & timeouts
    const [sceneCutTimestamps, silentIntervals] = await Promise.all([
      this.detectSceneChanges(videoPath, duration),
      this.detectSilences(videoPath, duration),
    ]);

    logger.debug(`Found ${sceneCutTimestamps.length} scene cuts and ${silentIntervals.length} silent intervals.`);

    // 2. Generate candidate sliding windows across the duration
    // Calculate step so we produce plenty of candidate windows
    const step = Math.max(1, Math.floor(targetDuration / 4));
    const candidateWindows: { start: number; end: number; score: number; reason: string }[] = [];

    for (let start = 0; start + targetDuration <= duration + 0.5; start += step) {
      const end = Math.min(duration, start + targetDuration);
      const actualDuration = end - start;
      if (actualDuration < 2) continue;

      // Calculate silence ratio in this window
      let silentSeconds = 0;
      for (const silence of silentIntervals) {
        const overlapStart = Math.max(start, silence.start);
        const overlapEnd = Math.min(end, silence.end);
        if (overlapEnd > overlapStart) {
          silentSeconds += overlapEnd - overlapStart;
        }
      }
      const silenceRatio = silentSeconds / actualDuration;

      // Count scene cuts within this window
      const cutsInWindow = sceneCutTimestamps.filter(t => t >= start && t <= end).length;

      // Activity score: non-silence activity
      const activityScore = Math.max(0.2, 1.0 - silenceRatio);

      // Visual dynamics score
      let sceneScore = 0.6;
      if (cutsInWindow >= 1 && cutsInWindow <= 5) {
        sceneScore = 0.95;
      } else if (cutsInWindow > 5) {
        sceneScore = 0.8;
      }

      // Time position score
      const centerFactor = 1.0 - Math.abs((start + end) / 2 - duration / 2) / (duration / 2 || 1);
      const positionScore = 0.7 + 0.3 * centerFactor;

      const finalScore = parseFloat((activityScore * 0.45 + sceneScore * 0.35 + positionScore * 0.20).toFixed(2));

      let reason = 'Balanced audio & visual highlight';
      if (cutsInWindow >= 2 && activityScore > 0.7) {
        reason = 'High activity segment with dynamic cuts';
      } else if (activityScore > 0.85) {
        reason = 'Continuous high vocal/audio engagement';
      } else if (cutsInWindow >= 1) {
        reason = 'Key scene transition with steady activity';
      } else if (start === 0) {
        reason = 'High-impact opening hook';
      }

      candidateWindows.push({
        start: parseFloat(start.toFixed(1)),
        end: parseFloat(end.toFixed(1)),
        score: finalScore,
        reason,
      });
    }

    // Sort by highest score first
    candidateWindows.sort((a, b) => b.score - a.score);

    // 3. Deduplicate overlapping clips
    const selectedClips: CandidateClip[] = [];
    // Allow moderate overlap if needed to generate the requested count
    const minSeparation = Math.max(2, targetDuration * 0.35);

    for (const cand of candidateWindows) {
      if (selectedClips.length >= requestedCount) break;

      const candCenter = (cand.start + cand.end) / 2;
      const overlaps = selectedClips.some(sel => {
        const selCenter = (sel.startTime + sel.endTime) / 2;
        return Math.abs(candCenter - selCenter) < minSeparation;
      });

      if (!overlaps) {
        selectedClips.push({
          startTime: cand.start,
          endTime: cand.end,
          score: cand.score,
          reason: cand.reason,
        });
      }
    }

    // 4. GUARANTEE: If selectedClips has fewer than requestedCount, backfill evenly spaced highlight windows
    if (selectedClips.length < requestedCount) {
      const needed = requestedCount - selectedClips.length;
      logger.info(`Backfilling ${needed} additional highlight segments to fulfill requested count (${requestedCount})`);

      // Compute evenly spaced window offsets
      const effectiveLength = Math.min(targetDuration, Math.max(3, duration / (requestedCount * 0.6)));
      const maxStart = Math.max(0, duration - effectiveLength);
      const stepInterval = requestedCount > 1 ? maxStart / (requestedCount - 1) : 0;

      for (let i = 0; i < requestedCount; i++) {
        if (selectedClips.length >= requestedCount) break;

        const start = parseFloat(Math.min(maxStart, i * stepInterval).toFixed(1));
        const end = parseFloat(Math.min(duration, start + effectiveLength).toFixed(1));

        // Check if this exact range already exists
        const exists = selectedClips.some(
          c => Math.abs(c.startTime - start) < 1.0 && Math.abs(c.endTime - end) < 1.0
        );

        if (!exists) {
          let reason = `Key moment #${selectedClips.length + 1}`;
          if (i === 0) reason = 'Opening hook segment';
          else if (i === requestedCount - 1) reason = 'Climax & closing takeaway';
          else reason = `Core dialogue highlight #${i + 1}`;

          selectedClips.push({
            startTime: start,
            endTime: end,
            score: parseFloat((0.90 - i * 0.03).toFixed(2)),
            reason,
          });
        }
      }
    }

    // Fallback: If still empty (e.g. 2 second video), return at least 1 clip
    if (selectedClips.length === 0) {
      selectedClips.push({
        startTime: 0,
        endTime: parseFloat(duration.toFixed(1)),
        score: 0.95,
        reason: 'Complete highlight clip',
      });
    }

    // Return in chronological order
    const result = selectedClips.sort((a, b) => a.startTime - b.startTime);
    logger.info(`Final clips produced: ${result.length}`);
    return result;
  }

  private async detectSceneChanges(videoPath: string, duration: number): Promise<number[]> {
    try {
      // Downscale to 320:-1 and output to NULL_DEVICE for high-speed analysis
      const args = [
        '-i', videoPath,
        '-vf', "scale=320:-1,select='gt(scene,0.3)',metadata=print",
        '-f', 'null',
        NULL_DEVICE,
      ];
      const { stderr } = await execFileAsync(config.ffmpegPath, args, {
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const sceneCuts: number[] = [];
      const regex = /pts_time:([0-9.]+)/g;
      let match;
      while ((match = regex.exec(stderr)) !== null) {
        const time = parseFloat(match[1]);
        if (!isNaN(time) && time <= duration) {
          sceneCuts.push(time);
        }
      }
      return sceneCuts;
    } catch (err: any) {
      logger.debug('Scene change detection fast-fallback triggered:', err.message);
      return [];
    }
  }

  private async detectSilences(videoPath: string, duration: number): Promise<Array<{ start: number; end: number }>> {
    try {
      const args = [
        '-i', videoPath,
        '-af', 'silencedetect=noise=-30dB:d=0.6',
        '-f', 'null',
        NULL_DEVICE,
      ];
      const { stderr } = await execFileAsync(config.ffmpegPath, args, {
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const silences: Array<{ start: number; end: number }> = [];
      const startRegex = /silence_start: ([0-9.]+)/g;
      const endRegex = /silence_end: ([0-9.]+)/g;

      const starts: number[] = [];
      const ends: number[] = [];

      let m;
      while ((m = startRegex.exec(stderr)) !== null) {
        starts.push(parseFloat(m[1]));
      }
      while ((m = endRegex.exec(stderr)) !== null) {
        ends.push(parseFloat(m[1]));
      }

      for (let i = 0; i < starts.length; i++) {
        silences.push({
          start: starts[i],
          end: ends[i] !== undefined ? ends[i] : Math.min(duration, starts[i] + 2),
        });
      }

      return silences;
    } catch (err: any) {
      logger.debug('Silence detection fast-fallback triggered:', err.message);
      return [];
    }
  }
}

export const clipAnalyzer = new HeuristicClipAnalyzer();
