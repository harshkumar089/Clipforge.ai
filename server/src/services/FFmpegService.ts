import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { VideoMetadataService } from './VideoMetadataService.js';
import { fontService } from './FontService.js';
import { subtitleAssService } from './SubtitleAssService.js';

export interface TextOverlayConfig {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  position: 'top' | 'center' | 'bottom' | 'custom';
  xPercent?: number;
  yPercent?: number;
  isBold: boolean;
  fontWeight?: number | string;
  lineHeight?: number;
  alignment: 'left' | 'center' | 'right';
  startTime?: number;
  endTime?: number;
  fontFamily?: string;
  outlineColor?: string;
  outlineWidth?: number;
  shadowStyle?: 'none' | 'soft' | 'hard' | 'glow';
  shadowColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  isUppercase?: boolean;
  letterSpacing?: number;
  animation?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationIntensity?: number;
}

export type FFmpegVideoFilter =
  | 'normal'
  | 'bright'
  | 'contrast'
  | 'cinematic'
  | 'warm'
  | 'cool'
  | 'vibrant'
  | 'vintage'
  | 'faded'
  | 'dramatic'
  | 'cyberpunk'
  | 'grayscale';

export interface OverlayMusicConfig {
  filePath: string;
  volume: number; // 0 to 150 (%)
  loop?: boolean;
  startTime?: number; // offset in audio track
  fadeIn?: number;
  fadeOut?: number;
}

export interface RenderOptions {
  startTime: number;
  endTime: number;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
  resolution?: '720p' | '1080p' | '4k';
  filter?: FFmpegVideoFilter;
  filterIntensity?: number;
  adjustments?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    warmth?: number;
    vignette?: number;
  };
  stickers?: any[];
  speed?: number; // 0.5, 1.0, 1.5, 2.0
  volume?: number; // 0 to 200 (%)
  textOverlays?: TextOverlayConfig[];
  overlayMusic?: OverlayMusicConfig;
  transition?: {
    type: string;
    duration: number;
    position: 'start' | 'end' | 'both';
  };
  effect?: {
    type: string;
    intensity: number;
    speed: number;
  };
  soundEffects?: Array<{
    id: string;
    name: string;
    category: string;
    time: number;
    volume: number;
    type: string;
  }>;
  voiceEffect?: {
    type: string;
    intensity: number;
  };
  watermark?: {
    enabled: boolean;
    url?: string;
    text?: string;
    x: number;
    y: number;
    scale: number;
    opacity: number;
  };
  speedCurve?: {
    mode: string;
    curvePoints?: Array<{ progress: number; speed: number }>;
  };
  preset?: 'ultrafast' | 'veryfast' | 'fast';
  onProgress?: (progressPercent: number) => void;
}

export class FFmpegService {
  /**
   * Fast keyframe trim of a video segment
   */
  public async trimVideo(
    inputPath: string,
    startTime: number,
    duration: number,
    outputPath: string
  ): Promise<void> {
    try {
      const args = [
        '-nostdin',
        '-y',
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-i', inputPath,
        '-map', '0:v:0',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '22',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-avoid_negative_ts', 'make_zero',
        outputPath,
      ];
      await this.runProcess(args);
    } catch (err: any) {
      logger.warn(`Initial trim failed for ${inputPath}, attempting fallback trim:`, err.message);
      const fallbackArgs = [
        '-nostdin',
        '-y',
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-i', inputPath,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-c:a', 'copy',
        outputPath,
      ];
      await this.runProcess(fallbackArgs);
    }
  }

  /**
   * Multi-stage pipeline to render a video clip with all visual/audio edits applied
   */
  public async exportVideo(
    inputPath: string,
    outputPath: string,
    options: RenderOptions
  ): Promise<void> {
    const {
      startTime = 0,
      endTime,
      aspectRatio = '9:16',
      resolution = '1080p',
      filter = 'normal',
      filterIntensity = 100,
      speed = 1.0,
      volume = 100,
      textOverlays = [],
      adjustments,
      stickers = [],
      overlayMusic,
      transition,
      effect,
      voiceEffect,
      watermark,
      onProgress,
    } = options;

    const clipDuration = Math.max(1, (endTime !== undefined ? endTime - startTime : 15));

    // Target dimensions based on aspect ratio and resolution
    let targetWidth = 1080;
    let targetHeight = 1920;

    if (resolution === '720p') {
      if (aspectRatio === '9:16') {
        targetWidth = 720;
        targetHeight = 1280;
      } else if (aspectRatio === '4:5') {
        targetWidth = 720;
        targetHeight = 900;
      } else if (aspectRatio === '16:9') {
        targetWidth = 1280;
        targetHeight = 720;
      } else if (aspectRatio === '1:1') {
        targetWidth = 720;
        targetHeight = 720;
      } else {
        targetWidth = 1280;
        targetHeight = 720;
      }
    } else if (resolution === '4k') {
      if (aspectRatio === '9:16') {
        targetWidth = 2160;
        targetHeight = 3840;
      } else if (aspectRatio === '4:5') {
        targetWidth = 2160;
        targetHeight = 2700;
      } else if (aspectRatio === '16:9') {
        targetWidth = 3840;
        targetHeight = 2160;
      } else if (aspectRatio === '1:1') {
        targetWidth = 2160;
        targetHeight = 2160;
      } else {
        targetWidth = 3840;
        targetHeight = 2160;
      }
    } else {
      // 1080p
      if (aspectRatio === '9:16') {
        targetWidth = 1080;
        targetHeight = 1920;
      } else if (aspectRatio === '4:5') {
        targetWidth = 1080;
        targetHeight = 1350;
      } else if (aspectRatio === '16:9') {
        targetWidth = 1920;
        targetHeight = 1080;
      } else if (aspectRatio === '1:1') {
        targetWidth = 1080;
        targetHeight = 1080;
      } else {
        targetWidth = 1920;
        targetHeight = 1080;
      }
    }

    // Build video filter graph
    const videoFilters: string[] = [];

    // 1. Aspect ratio handling - Optimized fast downscale-blur-upscale (45x faster than full-res multi-pass blur)
    if (aspectRatio === '9:16') {
      videoFilters.push(
        `split[fg][bg];[bg]scale=160:284:force_original_aspect_ratio=increase,crop=160:284,boxblur=5:1,scale=${targetWidth}:${targetHeight}:flags=fast_bilinear[bgblur];[fg]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease[fgscaled];[bgblur][fgscaled]overlay=(W-w)/2:(H-h)/2`
      );
    } else if (aspectRatio === '4:5') {
      videoFilters.push(
        `split[fg][bg];[bg]scale=160:200:force_original_aspect_ratio=increase,crop=160:200,boxblur=5:1,scale=${targetWidth}:${targetHeight}:flags=fast_bilinear[bgblur];[fg]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease[fgscaled];[bgblur][fgscaled]overlay=(W-w)/2:(H-h)/2`
      );
    } else if (aspectRatio === '1:1') {
      videoFilters.push(
        `split[fg][bg];[bg]scale=160:160:force_original_aspect_ratio=increase,crop=160:160,boxblur=5:1,scale=${targetWidth}:${targetHeight}:flags=fast_bilinear[bgblur];[fg]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease[fgscaled];[bgblur][fgscaled]overlay=(W-w)/2:(H-h)/2`
      );
    } else if (aspectRatio === '16:9') {
      videoFilters.push(
        `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`
      );
    } else {
      // Original scaling
      videoFilters.push(`scale='min(${targetWidth},iw)':-2`);
    }

    // 2. Color / Look filters with Intensity Scaling (0 to 100%)
    const intensity = Math.max(0, Math.min(100, filterIntensity !== undefined ? filterIntensity : 100));
    const factor = intensity / 100;

    if (factor > 0 && filter !== 'normal') {
      if (filter === 'bright') {
        const b = (0.08 * factor).toFixed(2);
        const c = (1 + 0.15 * factor).toFixed(2);
        const s = (1 + 0.2 * factor).toFixed(2);
        videoFilters.push(`eq=brightness=${b}:contrast=${c}:saturation=${s}`);
      } else if (filter === 'contrast') {
        const c = (1 + 0.45 * factor).toFixed(2);
        const s = (1 + 0.25 * factor).toFixed(2);
        videoFilters.push(`eq=contrast=${c}:saturation=${s}`);
      } else if (filter === 'cinematic') {
        const c = (1 + 0.25 * factor).toFixed(2);
        const s = (1 + 0.2 * factor).toFixed(2);
        const rs = (0.08 * factor).toFixed(2);
        const bs = (-0.08 * factor).toFixed(2);
        const rh = (0.06 * factor).toFixed(2);
        const bh = (-0.05 * factor).toFixed(2);
        videoFilters.push(`eq=contrast=${c}:saturation=${s},colorbalance=rs=${rs}:bs=${bs}:rh=${rh}:bh=${bh}`);
      } else if (filter === 'warm') {
        const rs = (0.12 * factor).toFixed(2);
        const gs = (0.04 * factor).toFixed(2);
        const bs = (-0.12 * factor).toFixed(2);
        const s = (1 + 0.25 * factor).toFixed(2);
        videoFilters.push(`colorbalance=rs=${rs}:gs=${gs}:bs=${bs},eq=saturation=${s}`);
      } else if (filter === 'cool') {
        const rs = (-0.08 * factor).toFixed(2);
        const bs = (0.12 * factor).toFixed(2);
        const rh = (-0.05 * factor).toFixed(2);
        const bh = (0.1 * factor).toFixed(2);
        const c = (1 + 0.12 * factor).toFixed(2);
        videoFilters.push(`colorbalance=rs=${rs}:bs=${bs}:rh=${rh}:bh=${bh},eq=contrast=${c}`);
      } else if (filter === 'vibrant') {
        const s = (1 + 0.75 * factor).toFixed(2);
        const c = (1 + 0.15 * factor).toFixed(2);
        videoFilters.push(`eq=saturation=${s}:contrast=${c}`);
      } else if (filter === 'vintage') {
        const s = (1 - 0.2 * factor).toFixed(2);
        const c = (1 + 0.1 * factor).toFixed(2);
        videoFilters.push(`curves=vintage,eq=saturation=${s}:contrast=${c}`);
      } else if (filter === 'faded') {
        const c = (1 - 0.15 * factor).toFixed(2);
        const b = (0.06 * factor).toFixed(2);
        const s = (1 - 0.25 * factor).toFixed(2);
        videoFilters.push(`eq=contrast=${c}:brightness=${b}:saturation=${s}`);
      } else if (filter === 'dramatic') {
        const s = (1 - factor).toFixed(2);
        const c = (1 + 0.5 * factor).toFixed(2);
        videoFilters.push(`hue=s=${s},eq=contrast=${c}`);
      } else if (filter === 'cyberpunk') {
        const c = (1 + 0.3 * factor).toFixed(2);
        const s = (1 + 0.5 * factor).toFixed(2);
        const h = (20 * factor).toFixed(1);
        videoFilters.push(`eq=contrast=${c}:saturation=${s},hue=h=${h}`);
      } else if (filter === 'grayscale') {
        const s = (1 - factor).toFixed(2);
        videoFilters.push(`hue=s=${s}`);
      }
    }

    // 2.b Fine-tuning Color Adjustments (Brightness, Contrast, Saturation, Warmth, Vignette)
    if (adjustments) {
      const bAdj = ((adjustments.brightness || 0) / 100).toFixed(2);
      const cAdj = (1 + (adjustments.contrast || 0) / 100).toFixed(2);
      const sAdj = (1 + (adjustments.saturation || 0) / 100).toFixed(2);
      if (adjustments.brightness || adjustments.contrast || adjustments.saturation) {
        videoFilters.push(`eq=brightness=${bAdj}:contrast=${cAdj}:saturation=${sAdj}`);
      }
      if (adjustments.warmth) {
        const w = adjustments.warmth / 100;
        videoFilters.push(`colorbalance=rs=${(w * 0.15).toFixed(2)}:bs=${(-w * 0.15).toFixed(2)}`);
      }
      if (adjustments.vignette && adjustments.vignette > 0) {
        videoFilters.push(`vignette=PI/5`);
      }
    }

    // 3. Playback speed
    if (speed !== 1.0 && speed > 0) {
      const pts = (1.0 / speed).toFixed(4);
      videoFilters.push(`setpts=${pts}*PTS`);
    }

    // 3.b CapCut Visual Effects (Shake, VHS, Film Grain, Mirror, Neon Glow, Flash)
    if (effect && effect.type && effect.type !== 'none') {
      const fxSpeed = effect.speed || 1.0;
      if (effect.type === 'shake') {
        const shakeFreq = (6 * fxSpeed).toFixed(1);
        videoFilters.push(`crop=in_w-24:in_h-24:12+8*sin(${shakeFreq}*PI*t):12+8*cos(${shakeFreq}*PI*t)`);
      } else if (effect.type === 'vhs') {
        videoFilters.push(`curves=vintage,noise=c1s=7:c0f=u`);
      } else if (effect.type === 'film_grain') {
        videoFilters.push(`noise=alls=10:allf=t+u`);
      } else if (effect.type === 'mirror') {
        videoFilters.push(`hflip`);
      } else if (effect.type === 'neon_glow') {
        videoFilters.push(`eq=saturation=1.85:contrast=1.35`);
      } else if (effect.type === 'flash') {
        videoFilters.push(`eq=brightness='if(lt(mod(t,1.2),0.12),0.35,0)'`);
      }
    }

    // 3.c CapCut Video Transitions
    if (transition && transition.type && transition.type !== 'none') {
      const transDuration = Math.max(0.2, Math.min(2.0, transition.duration || 0.5));
      const pos = transition.position || 'start';
      const outStart = Math.max(0, clipDuration - transDuration);

      if (transition.type === 'fade' || transition.type === 'flash_black') {
        if (pos === 'start' || pos === 'both') {
          videoFilters.push(`fade=t=in:st=0:d=${transDuration.toFixed(2)}:color=black`);
        }
        if (pos === 'end' || pos === 'both') {
          videoFilters.push(`fade=t=out:st=${outStart.toFixed(2)}:d=${transDuration.toFixed(2)}:color=black`);
        }
      } else if (transition.type === 'flash_white') {
        if (pos === 'start' || pos === 'both') {
          videoFilters.push(`fade=t=in:st=0:d=${transDuration.toFixed(2)}:color=white`);
        }
        if (pos === 'end' || pos === 'both') {
          videoFilters.push(`fade=t=out:st=${outStart.toFixed(2)}:d=${transDuration.toFixed(2)}:color=white`);
        }
      }
    }

    // 4. Kinetic Typography & Text overlays via libass (ASS) with safety fallback
    if (textOverlays && textOverlays.length > 0) {
      let assFilterApplied = false;
      try {
        // Step 1: Ensure all requested fonts are cached in server/fonts/
        await Promise.all(
          textOverlays.map((t) => (t.fontFamily ? fontService.ensureFontCached(t.fontFamily) : Promise.resolve('')))
        );

        // Step 2: Generate ASS script preserving kinetic vector animations
        const assJobId = path.basename(outputPath, path.extname(outputPath));
        const assScriptPath = subtitleAssService.generateAssScript({
          overlays: textOverlays,
          targetWidth,
          targetHeight,
          clipDuration,
          jobId: assJobId,
          tempDir: config.uploadDir,
        });

        if (fs.existsSync(assScriptPath) && fs.statSync(assScriptPath).size > 50) {
          // Format paths for FFmpeg filter on Windows
          const cleanAssPath = assScriptPath.replace(/\\/g, '/').replace(/:/g, '\\:');
          const cleanFontsDir = fontService.getFontsDir().replace(/\\/g, '/').replace(/:/g, '\\:');
          videoFilters.push(`ass=filename='${cleanAssPath}':fontsdir='${cleanFontsDir}'`);
          assFilterApplied = true;
          logger.info(`FFmpegService: Successfully applied ASS kinetic subtitle filter from ${assScriptPath}`);
        }
      } catch (assErr: any) {
        logger.warn('FFmpegService: ASS generation failed, falling back to drawtext filter:', assErr.message);
      }

      // Step 3: Controlled Fallback to drawtext if ASS generation or loading failed
      if (!assFilterApplied) {
        for (const t of textOverlays) {
          if (!t.text || !t.text.trim()) continue;

          let yPos = '(h-text_h)/2';
          if (t.position === 'top') {
            yPos = 'h*0.12';
          } else if (t.position === 'bottom') {
            yPos = 'h*0.82';
          } else if (t.position === 'custom' && t.yPercent !== undefined) {
            yPos = `(h*${(t.yPercent / 100).toFixed(2)}-text_h/2)`;
          }

          let xPos = '(w-text_w)/2';
          if (t.position === 'custom' && t.xPercent !== undefined) {
            xPos = `(w*${(t.xPercent / 100).toFixed(2)}-text_w/2)`;
          } else if (t.alignment === 'left') {
            xPos = 'w*0.08';
          } else if (t.alignment === 'right') {
            xPos = 'w*0.92-text_w';
          }

          const size = Math.round((t.fontSize || 28) * (targetHeight / 720));
          let color = t.color || 'white';
          if (color.startsWith('#')) {
            color = '0x' + color.slice(1);
          }

          let displayText = t.text;
          if (t.isUppercase) {
            displayText = displayText.toUpperCase();
          }
          const escapedText = displayText
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/:/g, '\\:');

          const drawtextParams: string[] = [
            `text='${escapedText}'`,
            `fontcolor=${color}`,
            `fontsize=${size}`,
            `x=${xPos}`,
            `y=${yPos}`,
          ];

          if (t.fontFamily) {
            const cleanFont = t.fontFamily.replace(/['"]/g, '');
            drawtextParams.push(`font='${cleanFont}'`);
          }

          if (t.outlineWidth && t.outlineWidth > 0) {
            const borderw = Math.max(1, Math.round(t.outlineWidth * (targetHeight / 720)));
            let bordercolor = t.outlineColor || 'black';
            if (bordercolor.startsWith('#')) bordercolor = '0x' + bordercolor.slice(1);
            drawtextParams.push(`borderw=${borderw}`);
            drawtextParams.push(`bordercolor=${bordercolor}`);
          }

          if (t.shadowStyle && t.shadowStyle !== 'none') {
            let shadowcolor = t.shadowColor || 'black';
            if (shadowcolor.startsWith('#')) shadowcolor = '0x' + shadowcolor.slice(1);
            const shadowOffset = t.shadowStyle === 'hard' ? 4 : 2;
            drawtextParams.push(`shadowcolor=${shadowcolor}@0.8`);
            drawtextParams.push(`shadowx=${shadowOffset}`);
            drawtextParams.push(`shadowy=${shadowOffset}`);
          }

          if (t.backgroundColor) {
            let boxcolor = t.backgroundColor;
            if (boxcolor.startsWith('#')) boxcolor = '0x' + boxcolor.slice(1);
            const opacity = t.backgroundOpacity !== undefined ? t.backgroundOpacity.toFixed(2) : '0.60';
            drawtextParams.push('box=1');
            drawtextParams.push(`boxcolor=${boxcolor}@${opacity}`);
            drawtextParams.push('boxborderw=10');
          } else {
            drawtextParams.push('box=1:boxcolor=black@0.5:boxborderw=10');
          }

          videoFilters.push(`drawtext=${drawtextParams.join(':')}`);
        }
      }
    }

    // 4.b Watermark / PIP Overlay
    if (watermark && watermark.enabled) {
      if (watermark.text && watermark.text.trim()) {
        const wmScale = watermark.scale || 1.0;
        const wmSize = Math.max(14, Math.round(20 * wmScale * (targetHeight / 720)));
        const wmOpacity = ((watermark.opacity !== undefined ? watermark.opacity : 80) / 100).toFixed(2);
        const wmXPercent = watermark.x !== undefined ? watermark.x : 85;
        const wmYPercent = watermark.y !== undefined ? watermark.y : 10;
        const wmX = `(w*${(wmXPercent / 100).toFixed(2)}-text_w/2)`;
        const wmY = `(h*${(wmYPercent / 100).toFixed(2)}-text_h/2)`;
        const escapedWm = watermark.text
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/:/g, '\\:');
        videoFilters.push(
          `drawtext=text='${escapedWm}':fontcolor=white@${wmOpacity}:fontsize=${wmSize}:x=${wmX}:y=${wmY}:box=1:boxcolor=black@0.45:boxborderw=6`
        );
      }
    }

    // 5. Stickers burn-in (badges, emojis, custom text labels, and imported image stickers)
    const textStickers = (stickers || []).filter((s) => s.type !== 'image');
    const imageStickers = (stickers || []).filter((s) => s.type === 'image' && s.content);

    if (textStickers.length > 0) {
      for (const st of textStickers) {
        if (!st.content && !st.label) continue;
        const stScale = st.scale !== undefined ? st.scale : 1.0;
        const stSize = Math.max(14, Math.round(24 * stScale * (targetHeight / 720)));
        const stXPercent = st.x !== undefined ? st.x : 50;
        const stYPercent = st.y !== undefined ? st.y : 50;
        const stX = `(w*${(stXPercent / 100).toFixed(2)}-text_w/2)`;
        const stY = `(h*${(stYPercent / 100).toFixed(2)}-text_h/2)`;

        let textToDraw = st.label || st.content;
        if (st.type === 'badge') {
          textToDraw = st.label ? `[ ${st.label.toUpperCase()} ]` : `[ ${st.content.toUpperCase()} ]`;
        }

        if (textToDraw) {
          const escapedSticker = textToDraw
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/:/g, '\\:');

          const stBoxColor =
            st.content === 'subscribe'
              ? 'red@0.85'
              : st.content === 'trending'
              ? '0xFF8800@0.85'
              : '0x6366F1@0.85';

          videoFilters.push(
            `drawtext=text='${escapedSticker}':fontcolor=white:fontsize=${stSize}:x=${stX}:y=${stY}:box=1:boxcolor=${stBoxColor}:boxborderw=6`
          );
        }
      }
    }

    // Process imported image stickers
    const tempFilesToClean: string[] = [];
    interface PreparedImageSticker {
      filePath: string;
      x: number;
      y: number;
      scale: number;
      opacity: number;
    }
    const preparedImageStickers: PreparedImageSticker[] = [];

    if (imageStickers.length > 0) {
      for (let i = 0; i < imageStickers.length; i++) {
        const st = imageStickers[i];
        if (!st.content) continue;

        try {
          // Check if base64 data URL
          if (st.content.startsWith('data:image/')) {
            const matches = st.content.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            if (matches) {
              let ext = matches[1].toLowerCase();
              if (ext === 'jpeg') ext = 'jpg';
              if (ext === 'svg+xml') ext = 'svg';
              const buffer = Buffer.from(matches[2], 'base64');
              const tempStickerPath = path.join(
                config.uploadDir,
                `temp_stk_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}.${ext}`
              );
              fs.writeFileSync(tempStickerPath, buffer);
              tempFilesToClean.push(tempStickerPath);
              preparedImageStickers.push({
                filePath: tempStickerPath,
                x: st.x !== undefined ? st.x : 50,
                y: st.y !== undefined ? st.y : 50,
                scale: st.scale !== undefined ? st.scale : 1.0,
                opacity: st.opacity !== undefined ? st.opacity : 1.0,
              });
              continue;
            }
          }

          // Check if existing file path
          if (fs.existsSync(st.content)) {
            preparedImageStickers.push({
              filePath: st.content,
              x: st.x !== undefined ? st.x : 50,
              y: st.y !== undefined ? st.y : 50,
              scale: st.scale !== undefined ? st.scale : 1.0,
              opacity: st.opacity !== undefined ? st.opacity : 1.0,
            });
            continue;
          }

          // Check uploads directory
          const uploadPath = path.join(config.uploadDir, path.basename(st.content));
          if (fs.existsSync(uploadPath)) {
            preparedImageStickers.push({
              filePath: uploadPath,
              x: st.x !== undefined ? st.x : 50,
              y: st.y !== undefined ? st.y : 50,
              scale: st.scale !== undefined ? st.scale : 1.0,
              opacity: st.opacity !== undefined ? st.opacity : 1.0,
            });
            continue;
          }
        } catch (stkErr) {
          logger.warn(`Failed to prepare image sticker [${st.label || i}]:`, stkErr);
        }
      }
    }

    const hasOverlayAudio = Boolean(
      overlayMusic && overlayMusic.filePath && fs.existsSync(overlayMusic.filePath)
    );

    const args: string[] = [
      '-nostdin',
      '-y',
      '-ss', startTime.toString(),
      '-t', clipDuration.toString(),
      '-i', inputPath,
    ];

    // Voice effects audio filters
    const voiceFilters: string[] = [];
    if (voiceEffect && voiceEffect.type && voiceEffect.type !== 'none') {
      if (voiceEffect.type === 'deep') {
        voiceFilters.push('asetrate=44100*0.82,atempo=1/0.82,bass=g=6');
      } else if (voiceEffect.type === 'chipmunk') {
        voiceFilters.push('asetrate=44100*1.28,atempo=1/1.28');
      } else if (voiceEffect.type === 'robot') {
        voiceFilters.push('flanger=delay=8:depth=4:regen=65:width=65:speed=0.5');
      } else if (voiceEffect.type === 'echo') {
        voiceFilters.push('aecho=0.8:0.88:400:0.35');
      } else if (voiceEffect.type === 'telephone') {
        voiceFilters.push('highpass=f=400,lowpass=f=3400,volume=1.2');
      }
    }

    if (hasOverlayAudio) {
      if (overlayMusic!.loop !== false) {
        args.push('-stream_loop', '-1');
      }
      if (overlayMusic!.startTime && overlayMusic!.startTime > 0) {
        args.push('-ss', overlayMusic!.startTime.toString());
      }
      args.push('-i', overlayMusic!.filePath);
    }

    // Add image sticker inputs
    const stickerInputStartIndex = hasOverlayAudio ? 2 : 1;
    for (const stk of preparedImageStickers) {
      args.push('-i', stk.filePath);
    }

    const needsComplexFilter = hasOverlayAudio || preparedImageStickers.length > 0;

    if (needsComplexFilter) {
      const complexFilters: string[] = [];

      // 1. Base video filter
      let currentVideoLabel = 'v_base';
      if (videoFilters.length > 0) {
        complexFilters.push(`[0:v]${videoFilters.join(',')}[${currentVideoLabel}]`);
      } else {
        complexFilters.push(`[0:v]null[${currentVideoLabel}]`);
      }

      // 2. Overlay each image sticker in succession
      preparedImageStickers.forEach((stk, idx) => {
        const inputIdx = stickerInputStartIndex + idx;
        const scaledWidth = Math.max(32, Math.round(targetWidth * 0.25 * stk.scale));
        const outStkTag = `stk_scaled_${idx}`;
        const outOverTag = `v_stk_${idx}`;

        const opacityFilter = stk.opacity < 1.0
          ? `,format=rgba,colorchannelmixer=aa=${stk.opacity.toFixed(2)}`
          : '';

        complexFilters.push(
          `[${inputIdx}:v]scale=${scaledWidth}:-1${opacityFilter}[${outStkTag}]`
        );

        const xPos = `(W*${(stk.x / 100).toFixed(2)}-w/2)`;
        const yPos = `(H*${(stk.y / 100).toFixed(2)}-h/2)`;

        complexFilters.push(
          `[${currentVideoLabel}][${outStkTag}]overlay=x='${xPos}':y='${yPos}':format=auto[${outOverTag}]`
        );
        currentVideoLabel = outOverTag;
      });

      // Output final video tag
      complexFilters.push(`[${currentVideoLabel}]null[v]`);

      // 3. Audio handling in complex filter
      if (hasOverlayAudio) {
        let videoHasAudio = true;
        try {
          const metaService = new VideoMetadataService();
          const meta = await metaService.getMetadata(inputPath);
          videoHasAudio = meta.hasAudio;
        } catch {
          videoHasAudio = true;
        }

        const vidVol = (Math.max(0, Math.min(200, volume)) / 100).toFixed(2);
        const speedFilter = speed !== 1.0 && speed >= 0.5 && speed <= 2.0 ? `,atempo=${speed.toFixed(2)}` : '';
        const voiceStr = voiceFilters.length > 0 ? `,${voiceFilters.join(',')}` : '';
        const musicVol = (Math.max(0, Math.min(150, overlayMusic!.volume !== undefined ? overlayMusic!.volume : 50)) / 100).toFixed(2);
        let musicFilter = `volume=${musicVol}`;
        if (overlayMusic!.fadeIn && overlayMusic!.fadeIn > 0) {
          musicFilter += `,afade=t=in:st=0:d=${overlayMusic!.fadeIn}`;
        }
        if (overlayMusic!.fadeOut && overlayMusic!.fadeOut > 0) {
          const outStart = Math.max(0, clipDuration - overlayMusic!.fadeOut);
          musicFilter += `,afade=t=out:st=${outStart.toFixed(2)}:d=${overlayMusic!.fadeOut}`;
        }

        if (videoHasAudio && volume > 0) {
          complexFilters.push(`[0:a]volume=${vidVol}${speedFilter}${voiceStr}[a0]`);
          complexFilters.push(`[1:a]${musicFilter}[a1]`);
          complexFilters.push(`[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[a]`);
        } else {
          complexFilters.push(`[1:a]${musicFilter}[a]`);
        }

        args.push('-filter_complex', complexFilters.join(';'));
        args.push('-map', '[v]', '-map', '[a]');
      } else {
        // No overlay audio, but complex filter used for image stickers
        const audioFilters: string[] = [];
        if (volume !== 100) {
          const volMultiplier = (Math.max(0, Math.min(200, volume)) / 100).toFixed(2);
          audioFilters.push(`volume=${volMultiplier}`);
        }
        if (speed !== 1.0 && speed >= 0.5 && speed <= 2.0) {
          audioFilters.push(`atempo=${speed.toFixed(2)}`);
        }
        if (voiceFilters.length > 0) {
          audioFilters.push(...voiceFilters);
        }

        if (audioFilters.length > 0) {
          complexFilters.push(`[0:a]${audioFilters.join(',')}[a]`);
          args.push('-filter_complex', complexFilters.join(';'));
          args.push('-map', '[v]', '-map', '[a]?');
        } else {
          args.push('-filter_complex', complexFilters.join(';'));
          args.push('-map', '[v]', '-map', '0:a?');
        }
      }
    } else {
      // Standard video + audio filters without overlay music or image stickers
      if (videoFilters.length > 0) {
        args.push('-vf', videoFilters.join(','));
      }

      const audioFilters: string[] = [];
      if (volume !== 100) {
        const volMultiplier = (Math.max(0, Math.min(200, volume)) / 100).toFixed(2);
        audioFilters.push(`volume=${volMultiplier}`);
      }
      if (speed !== 1.0 && speed >= 0.5 && speed <= 2.0) {
        audioFilters.push(`atempo=${speed.toFixed(2)}`);
      }
      if (voiceFilters.length > 0) {
        audioFilters.push(...voiceFilters);
      }
      if (audioFilters.length > 0) {
        args.push('-af', audioFilters.join(','));
      }

      args.push('-map', '0:v:0', '-map', '0:a?');
    }

    const crfValue = resolution === '4k' ? '20' : resolution === '720p' ? '24' : '22';
    const audioBitrate = resolution === '4k' ? '192k' : '128k';
    const encodingPreset = options.preset || 'veryfast';

    args.push(
      '-c:v', 'libx264',
      '-preset', encodingPreset,
      '-threads', '0',
      '-crf', crfValue,
      '-c:a', 'aac',
      '-b:a', audioBitrate,
      '-movflags', '+faststart',
      '-t', clipDuration.toString(),
      outputPath
    );

    logger.info(`Running export FFmpeg command with options:`, {
      aspectRatio,
      resolution,
      filter,
      speed,
      volume,
      textOverlaysCount: textOverlays.length,
      imageStickersCount: preparedImageStickers.length,
    });

    try {
      await this.runProcessWithProgress(args, clipDuration / speed, onProgress);
    } finally {
      for (const f of tempFilesToClean) {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch (cleanErr) {
          logger.warn(`Failed to cleanup temp sticker file: ${f}`, cleanErr);
        }
      }
    }
  }

  private runProcess(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(config.ffmpegPath, args);

      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          logger.error(`FFmpeg failed with code ${code}:\n${stderr.slice(-500)}`);
          reject(new Error(`FFmpeg processing failed (code ${code})`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  private runProcessWithProgress(
    args: string[],
    targetDurationSeconds: number,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(config.ffmpegPath, args);

      let stderr = '';
      const timeRegex = /time=([0-9:.]+)/;

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;

        if (onProgress && targetDurationSeconds > 0) {
          const match = text.match(timeRegex);
          if (match && match[1]) {
            const timeStr = match[1];
            const parts = timeStr.split(':');
            if (parts.length === 3) {
              const sec = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
              const pct = Math.min(99, Math.round((sec / targetDurationSeconds) * 100));
              onProgress(pct);
            }
          }
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          if (onProgress) onProgress(100);
          resolve();
        } else {
          logger.error(`FFmpeg export failed with code ${code}:\n${stderr.slice(-500)}`);
          reject(new Error(`FFmpeg export failed: ${stderr.slice(-200)}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export const ffmpegService = new FFmpegService();
