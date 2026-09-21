import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TextOverlay } from '../../types/index.js';
import { loadGoogleFont } from '../../utils/fonts.js';

interface KineticTextProps {
  overlay: TextOverlay;
  currentTime: number;
  isStaticPreview?: boolean;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  scaleFactor?: number;
}

const hexToRgba = (hex: string = '#000000', alpha: number = 0.5): string => {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(0, 0, 0, ${alpha})`;
};

const computeTextShadow = (style?: 'none' | 'soft' | 'hard' | 'glow', color: string = '#000000') => {
  if (!style || style === 'none') return undefined;
  if (style === 'soft') return `0 2px 8px ${color}, 0 1px 3px rgba(0,0,0,0.8)`;
  if (style === 'hard') return `3px 3px 0 ${color}, 4px 4px 0 rgba(0,0,0,0.9)`;
  if (style === 'glow') return `0 0 12px ${color}, 0 0 24px ${color}`;
  return undefined;
};

export const KineticText: React.FC<KineticTextProps> = ({
  overlay,
  currentTime,
  isStaticPreview = false,
  isDragging = false,
  onPointerDown,
  scaleFactor = 1,
}) => {
  // Load Google Font on demand
  useEffect(() => {
    if (overlay.fontFamily) {
      const weight = typeof overlay.fontWeight === 'number' ? overlay.fontWeight : 700;
      loadGoogleFont(overlay.fontFamily, [400, weight]);
    }
  }, [overlay.fontFamily, overlay.fontWeight]);

  const {
    text,
    fontSize = 32,
    fontWeight = 700,
    lineHeight = 1.2,
    color = '#ffffff',
    fontFamily = 'Montserrat',
    outlineColor = '#000000',
    outlineWidth = 0,
    shadowStyle = 'soft',
    shadowColor = '#000000',
    backgroundColor,
    backgroundOpacity = 0.5,
    isUppercase = false,
    letterSpacing = 0,
    animation = 'none',
    animationDuration = 0.6,
    animationDelay = 0,
    animationIntensity = 75,
    startTime = 0,
    endTime = 15,
  } = overlay;

  // Time calculations
  const relativeTime = isStaticPreview ? 999 : currentTime - startTime - animationDelay;
  const isWithinTimeRange = isStaticPreview || (currentTime >= startTime && currentTime <= endTime);

  // Intensity factor (0.1 to 1.0)
  const intensity = Math.max(0.1, Math.min(1.0, animationIntensity / 100));

  // Visual text formatting
  const formattedText = useMemo(() => {
    return isUppercase ? text.toUpperCase() : text;
  }, [text, isUppercase]);

  // Words array for Karaoke / Word Highlight
  const words = useMemo(() => {
    return formattedText.split(/(\s+)/);
  }, [formattedText]);

  // Style attributes
  const fontStyleFamily = fontFamily ? `'${fontFamily}', sans-serif` : 'sans-serif';
  const textShadow = computeTextShadow(shadowStyle, shadowColor);
  const strokeStyle = outlineWidth > 0 ? `${outlineWidth * scaleFactor}px ${outlineColor}` : undefined;
  const bgBoxColor = backgroundColor
    ? hexToRgba(backgroundColor, backgroundOpacity)
    : backgroundOpacity > 0
    ? `rgba(0, 0, 0, ${backgroundOpacity})`
    : 'transparent';

  if (!isWithinTimeRange) return null;

  // Animation progress normalized (0 to 1)
  const progress = isStaticPreview
    ? 1
    : relativeTime < 0
    ? 0
    : Math.min(1, relativeTime / Math.max(0.1, animationDuration));

  // Content rendering based on Kinetic Presets
  const renderContent = () => {
    switch (animation) {
      case 'typewriter': {
        const charCount = Math.max(1, Math.floor(progress * formattedText.length));
        const currentSlice = formattedText.slice(0, charCount);
        const cursor = progress < 1 ? '|' : '';
        return (
          <span>
            {currentSlice}
            <span className="animate-pulse text-purple-400 opacity-90">{cursor}</span>
          </span>
        );
      }

      case 'karaoke': {
        const activeWordIndex = Math.min(
          words.length - 1,
          Math.floor(progress * words.length)
        );
        return (
          <span>
            {words.map((w, idx) => {
              const isPast = idx <= activeWordIndex;
              return (
                <span
                  key={idx}
                  style={{
                    color: isPast ? '#FFE600' : color,
                    transition: 'color 0.15s ease',
                    textShadow: isPast ? '0 0 10px rgba(255,230,0,0.8)' : textShadow,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </span>
        );
      }

      case 'word_highlight': {
        const activeWordIndex = Math.min(
          words.length - 1,
          Math.floor(progress * words.length)
        );
        return (
          <span>
            {words.map((w, idx) => {
              const isHighlight = idx === activeWordIndex;
              return (
                <span
                  key={idx}
                  className={`inline-block transition-transform duration-200 ${
                    isHighlight ? 'scale-110 font-black' : ''
                  }`}
                  style={{
                    color: isHighlight ? '#FFE600' : color,
                    textShadow: isHighlight ? '0 0 14px rgba(255,230,0,0.9)' : textShadow,
                  }}
                >
                  {w}
                </span>
              );
            })}
          </span>
        );
      }

      case 'character_reveal': {
        const chars = Array.from(formattedText);
        const visibleChars = Math.max(1, Math.floor(progress * chars.length));
        return (
          <span>
            {chars.map((ch, idx) => (
              <span
                key={idx}
                className="inline-block transition-all duration-150"
                style={{
                  opacity: idx < visibleChars ? 1 : 0,
                  transform: idx < visibleChars ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.8)',
                }}
              >
                {ch}
              </span>
            ))}
          </span>
        );
      }

      default:
        return formattedText;
    }
  };

  // Motion physics parameters per kinetic preset
  let initialStyle: any = { opacity: 1, scale: 1, y: 0, x: 0 };
  let animateStyle: any = { opacity: 1, scale: 1, y: 0, x: 0 };
  let transitionConfig: any = { duration: animationDuration, ease: 'easeOut' };

  if (relativeTime < 0) {
    initialStyle.opacity = 0;
    animateStyle.opacity = 0;
  } else {
    switch (animation) {
      case 'pop': {
        const maxScale = 1 + 0.35 * intensity;
        initialStyle = { scale: 0.2, opacity: 0 };
        animateStyle = {
          scale: [0.2, maxScale, 0.96, 1],
          opacity: [0, 1, 1, 1],
        };
        transitionConfig = {
          duration: animationDuration,
          times: [0, 0.6, 0.85, 1],
          ease: 'easeOut',
        };
        break;
      }

      case 'bounce': {
        const dropDist = -60 * intensity;
        initialStyle = { y: dropDist, opacity: 0 };
        animateStyle = {
          y: [dropDist, 12 * intensity, -5 * intensity, 0],
          opacity: [0, 1, 1, 1],
        };
        transitionConfig = {
          duration: animationDuration,
          times: [0, 0.55, 0.8, 1],
          ease: 'easeOut',
        };
        break;
      }

      case 'fade_up':
      case 'fade_in': {
        const yOffset = 30 * intensity;
        initialStyle = { y: yOffset, opacity: 0 };
        animateStyle = { y: 0, opacity: 1 };
        transitionConfig = { duration: animationDuration, ease: [0.16, 1, 0.3, 1] };
        break;
      }

      case 'slide_up': {
        const slideDist = 80 * intensity;
        initialStyle = { y: slideDist, opacity: 0 };
        animateStyle = { y: 0, opacity: 1 };
        transitionConfig = { duration: animationDuration, ease: [0.22, 1, 0.36, 1] };
        break;
      }

      case 'scale_in': {
        initialStyle = { scale: 0.15, opacity: 0 };
        animateStyle = { scale: 1, opacity: 1 };
        transitionConfig = { duration: animationDuration, ease: 'easeOut' };
        break;
      }

      case 'punch': {
        const slamScale = 1.8 + 0.4 * intensity;
        initialStyle = { scale: slamScale, opacity: 0 };
        animateStyle = {
          scale: [slamScale, 0.92, 1.04, 1],
          opacity: [0, 1, 1, 1],
        };
        transitionConfig = {
          duration: animationDuration,
          times: [0, 0.45, 0.75, 1],
          ease: 'easeOut',
        };
        break;
      }

      case 'smooth_tracking': {
        const wideSpacing = Math.round(14 * intensity);
        initialStyle = { letterSpacing: `${wideSpacing}px`, opacity: 0 };
        animateStyle = { letterSpacing: `${letterSpacing}px`, opacity: 1 };
        transitionConfig = { duration: animationDuration, ease: [0.16, 1, 0.3, 1] };
        break;
      }

      case 'glitch': {
        if (progress < 0.8 && Math.random() > 0.3) {
          const jitterX = (Math.random() - 0.5) * 8 * intensity;
          const jitterY = (Math.random() - 0.5) * 6 * intensity;
          animateStyle = { x: jitterX, y: jitterY, opacity: 0.95 };
        } else {
          animateStyle = { x: 0, y: 0, opacity: 1 };
        }
        break;
      }

      default:
        // none / static
        initialStyle = { opacity: 1, scale: 1 };
        animateStyle = { opacity: 1, scale: 1 };
        break;
    }
  }

  return (
    <motion.div
      key={`${overlay.id}-${animation}`}
      initial={initialStyle}
      animate={animateStyle}
      transition={transitionConfig}
      onPointerDown={onPointerDown}
      style={{
        fontFamily: fontStyleFamily,
        fontSize: `${fontSize * scaleFactor}px`,
        fontWeight: fontWeight,
        lineHeight: lineHeight,
        color: color,
        textShadow: textShadow,
        WebkitTextStroke: strokeStyle,
        backgroundColor: bgBoxColor,
        letterSpacing: `${letterSpacing}px`,
        textAlign: overlay.alignment || 'center',
        padding: `${6 * scaleFactor}px ${14 * scaleFactor}px`,
      }}
      className={`select-none max-w-[92%] break-words rounded-2xl backdrop-blur-xs transition-shadow ${
        onPointerDown ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      } ${isDragging ? 'ring-2 ring-purple-400 shadow-2xl z-30 scale-105' : 'shadow-lg'}`}
    >
      {renderContent()}
    </motion.div>
  );
};
