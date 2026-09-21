import fs from 'fs';
import path from 'path';
import { TextOverlayConfig } from './FFmpegService.js';
import { fontService } from './FontService.js';
import { logger } from '../utils/logger.js';

export interface AssGenerationOptions {
  overlays: TextOverlayConfig[];
  targetWidth: number;
  targetHeight: number;
  clipDuration: number;
  jobId: string;
  tempDir: string;
}

/**
 * Converts CSS hex color (#RRGGBB or #RGB) to ASS BGR format (&H00BBGGRR)
 */
export const hexToAssColor = (hex: string = '#ffffff', alpha: number = 0): string => {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) clean = 'ffffff';

  const r = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const b = clean.substring(4, 6);

  // ASS Alpha: 00 = fully opaque, FF = fully transparent
  const aByte = Math.max(0, Math.min(255, Math.round(alpha * 255)));
  const aHex = aByte.toString(16).padStart(2, '0').toUpperCase();

  // Return &HAABBGGRR
  return `&H${aHex}${b.toUpperCase()}${g.toUpperCase()}${r.toUpperCase()}`;
};

/**
 * Formats seconds into ASS timestamp H:MM:SS.CC (centiseconds)
 */
export const formatAssTime = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const centis = Math.floor((safe % 1) * 100);

  return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
};

export class SubtitleAssService {
  /**
   * Generates a fully validated .ass subtitle script preserving Kinetic Typography animations
   */
  public generateAssScript(options: AssGenerationOptions): string {
    const { overlays, targetWidth, targetHeight, clipDuration, jobId, tempDir } = options;

    const scriptPath = path.join(tempDir, `kinetic-${jobId}.ass`);

    const lines: string[] = [
      '[Script Info]',
      'Title: ClipForge Kinetic Typography Subtitles',
      'ScriptType: v4.00+',
      'WrapStyle: 0',
      'ScaledBorderAndShadow: yes',
      'YCbCr Matrix: TV.709',
      `PlayResX: ${targetWidth}`,
      `PlayResY: ${targetHeight}`,
      '',
      '[V4+ Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    ];

    // Generate style headers for each overlay
    overlays.forEach((item, index) => {
      const styleName = `KineticStyle_${index}`;
      const validFont = fontService.validateFontFamily(item.fontFamily);
      // Scale font relative to standard 720p base
      const scaledSize = Math.max(16, Math.round((item.fontSize || 32) * (targetHeight / 720)));
      const primaryCol = hexToAssColor(item.color || '#ffffff', 0);
      const secondaryCol = hexToAssColor('#FFE600', 0); // Active karaoke sweep color
      const outlineCol = hexToAssColor(item.outlineColor || '#000000', 0);
      const backCol = hexToAssColor(
        item.backgroundColor || '#000000',
        item.backgroundOpacity !== undefined ? 1 - item.backgroundOpacity : 0.4
      );
      const isBold = item.isBold || item.fontWeight === 700 || item.fontWeight === 800 || item.fontWeight === 900 ? 1 : 0;
      const outlineWidth = item.outlineWidth !== undefined ? Math.max(0, Math.round(item.outlineWidth * (targetHeight / 720))) : 2;
      const shadowDist = item.shadowStyle === 'hard' ? 4 : item.shadowStyle === 'soft' ? 2 : 0;
      const spacing = item.letterSpacing || 0;

      lines.push(
        `Style: ${styleName},${validFont},${scaledSize},${primaryCol},${secondaryCol},${outlineCol},${backCol},${isBold},0,0,0,100,100,${spacing},0,1,${outlineWidth},${shadowDist},5,20,20,20,1`
      );
    });

    lines.push('', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text');

    // Generate Dialogues with Kinetic Vector Animation Tags
    overlays.forEach((item, index) => {
      if (!item.text || !item.text.trim()) return;

      const styleName = `KineticStyle_${index}`;
      const itemStart = Math.max(0, item.startTime ?? 0);
      const itemEnd = Math.min(clipDuration, item.endTime !== undefined ? item.endTime : clipDuration);
      if (itemStart >= itemEnd) return;

      const animPreset = (item.animation || 'none').toLowerCase();
      const animDuration = Math.max(0.2, Math.min(2.5, item.animationDuration || 0.6));
      const animDelay = Math.max(0, item.animationDelay || 0);
      const intensity = Math.max(10, Math.min(100, item.animationIntensity || 75)) / 100;

      // Position Calculation relative to target canvas
      let x = Math.round(targetWidth / 2);
      let y = Math.round(targetHeight / 2);

      if (item.position === 'top') {
        y = Math.round(targetHeight * 0.15);
      } else if (item.position === 'bottom') {
        y = Math.round(targetHeight * 0.82);
      } else if (item.position === 'custom') {
        if (item.xPercent !== undefined) x = Math.round((item.xPercent / 100) * targetWidth);
        if (item.yPercent !== undefined) y = Math.round((item.yPercent / 100) * targetHeight);
      }

      // Format text with multi-line support
      let rawText = item.text;
      if (item.isUppercase) rawText = rawText.toUpperCase();
      const escapedText = rawText.replace(/\r\n/g, '\\N').replace(/\n/g, '\\N');

      const startTimeStr = formatAssTime(itemStart);
      const endTimeStr = formatAssTime(itemEnd);

      const tAnimMs = Math.round(animDuration * 1000);
      const tDelayMs = Math.round(animDelay * 1000);

      let dialoguePayload = '';

      switch (animPreset) {
        case 'pop': {
          // Scale from 20% -> Overshoot (100 + 35*intensity)% -> 100%
          const maxScale = Math.round(100 + 35 * intensity);
          const t1 = Math.round(tAnimMs * 0.65);
          dialoguePayload = `{\\an5\\pos(${x},${y})\\fscx20\\fscy20\\t(${tDelayMs},${tDelayMs + t1},\\fscx${maxScale}\\fscy${maxScale})\\t(${tDelayMs + t1},${tDelayMs + tAnimMs},\\fscx100\\fscy100)}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'bounce': {
          // Drops down from above with gravity rebound
          const dropDist = Math.round(70 * intensity);
          const t1 = Math.round(tAnimMs * 0.6);
          dialoguePayload = `{\\an5\\move(${x},${y - dropDist},${x},${y},${tDelayMs},${tDelayMs + t1})\\t(${tDelayMs},${tDelayMs + t1},\\fscy115)\\t(${tDelayMs + t1},${tDelayMs + tAnimMs},\\fscy100)}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'fade_up':
        case 'fade_in': {
          // Soft fade in + gentle rise
          const yOffset = Math.round(40 * intensity);
          dialoguePayload = `{\\an5\\move(${x},${y + yOffset},${x},${y},${tDelayMs},${tDelayMs + tAnimMs})\\fad(${tAnimMs},120)}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'slide_up': {
          // Fast energetic upward slide
          const slideDist = Math.round(90 * intensity);
          dialoguePayload = `{\\an5\\move(${x},${y + slideDist},${x},${y},${tDelayMs},${tDelayMs + tAnimMs})}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'scale_in': {
          // Zoom from center into crisp focus
          dialoguePayload = `{\\an5\\pos(${x},${y})\\fscx15\\fscy15\\t(${tDelayMs},${tDelayMs + tAnimMs},\\fscx100\\fscy100)\\fad(${Math.round(tAnimMs * 0.6)},0)}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'punch': {
          // Aggressive camera slam with recoil
          const slamScale = Math.round(150 + 50 * intensity);
          const tSlam = Math.round(tAnimMs * 0.45);
          dialoguePayload = `{\\an5\\pos(${x},${y})\\fscx${slamScale}\\fscy${slamScale}\\t(${tDelayMs},${tDelayMs + tSlam},\\fscx95\\fscy95)\\t(${tDelayMs + tSlam},${tDelayMs + tAnimMs},\\fscx100\\fscy100)}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'smooth_tracking': {
          // Wide letter-spacing settling into baseline
          const wideTrack = Math.round(16 * intensity);
          const finalTrack = item.letterSpacing || 0;
          dialoguePayload = `{\\an5\\pos(${x},${y})\\fsp${wideTrack}\\t(${tDelayMs},${tDelayMs + tAnimMs},\\fsp${finalTrack})}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'karaoke': {
          // Word-by-word karaoke timing using ASS \kf tag
          const words = rawText.split(/\s+/);
          const wordCount = Math.max(1, words.length);
          const centisPerWord = Math.max(15, Math.round(((itemEnd - itemStart) * 100) / wordCount));
          const karaokeText = words.map((w) => `{\\kf${centisPerWord}}${w} `).join('').trim();
          dialoguePayload = `{\\an5\\pos(${x},${y})}${karaokeText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'word_highlight': {
          // Pulsing word highlight for short-form retention
          dialoguePayload = `{\\an5\\pos(${x},${y})\\t(${tDelayMs},${tDelayMs + 250},\\fscx110\\fscy110)\\t(${tDelayMs + 250},${tDelayMs + 500},\\fscx100\\fscy100)}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }

        case 'glitch': {
          // Cyberpunk rapid jitter during entrance
          const jitterOffset = Math.round(8 * intensity);
          const tStep = Math.round(tAnimMs / 4);
          for (let s = 0; s < 4; s++) {
            const jx = x + (s % 2 === 0 ? jitterOffset : -jitterOffset);
            const jy = y + (s % 3 === 0 ? -jitterOffset / 2 : jitterOffset / 2);
            const sStart = formatAssTime(itemStart + (s * tStep) / 1000);
            const sEnd = formatAssTime(itemStart + ((s + 1) * tStep) / 1000);
            lines.push(`Dialogue: 0,${sStart},${sEnd},${styleName},,0,0,0,,{\\an5\\pos(${jx},${jy})}${escapedText}`);
          }
          // Stable dialogue after glitch
          const stableStart = formatAssTime(itemStart + tAnimMs / 1000);
          lines.push(`Dialogue: 0,${stableStart},${endTimeStr},${styleName},,0,0,0,,{\\an5\\pos(${x},${y})}${escapedText}`);
          break;
        }

        case 'typewriter':
        case 'character_reveal': {
          // Progressive character slice
          const chars = Array.from(rawText);
          const charCount = Math.max(1, chars.length);
          const charStep = (animDuration / charCount);
          for (let c = 1; c <= charCount; c++) {
            const subStr = chars.slice(0, c).join('').replace(/\n/g, '\\N');
            const cStart = formatAssTime(itemStart + animDelay + (c - 1) * charStep);
            const cEnd = c === charCount ? endTimeStr : formatAssTime(itemStart + animDelay + c * charStep);
            const cursor = c < charCount && animPreset === 'typewriter' ? '|' : '';
            lines.push(`Dialogue: 0,${cStart},${cEnd},${styleName},,0,0,0,,{\\an5\\pos(${x},${y})}${subStr}${cursor}`);
          }
          break;
        }

        default: {
          // Static text
          dialoguePayload = `{\\an5\\pos(${x},${y})}${escapedText}`;
          lines.push(`Dialogue: 0,${startTimeStr},${endTimeStr},${styleName},,0,0,0,,${dialoguePayload}`);
          break;
        }
      }
    });

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const assContent = lines.join('\r\n');
    fs.writeFileSync(scriptPath, assContent, { encoding: 'utf-8' });
    logger.info(`SubtitleAssService: Generated ASS script at ${scriptPath} (${lines.length} lines)`);
    return scriptPath;
  }
}

export const subtitleAssService = new SubtitleAssService();
