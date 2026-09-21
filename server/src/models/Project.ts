import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;
  clipId?: mongoose.Types.ObjectId;
  edits: {
    startTime: number;
    endTime: number;
    aspectRatio: '9:16' | '16:9' | '1:1' | '4:5' | 'original';
    cropPosition?: { x: number; y: number };
    filter:
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
    filterIntensity?: number;
    adjustments?: {
      brightness: number;
      contrast: number;
      saturation: number;
      warmth: number;
      vignette: number;
    };
    stickers?: Array<{
      id: string;
      type: string;
      content: string;
      label?: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
      startTime?: number;
      endTime?: number;
    }>;
    speed: number;
    volume: number; // 0 - 200%
    overlayMusic?: {
      url: string;
      fileName?: string;
      originalName?: string;
      name?: string;
      volume: number; // 0 - 150%
      loop: boolean;
      startTime?: number;
      fadeIn?: number;
      fadeOut?: number;
    };
    textOverlays: Array<{
      id: string;
      text: string;
      fontSize: number;
      color: string;
      position: 'top' | 'center' | 'bottom' | 'custom';
      xPercent?: number;
      yPercent?: number;
      isBold: boolean;
      alignment: 'left' | 'center' | 'right';
      startTime: number;
      endTime: number;
      fontFamily?: string;
      fontWeight?: number | string;
      lineHeight?: number;
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
    }>;
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
    keyframes?: Array<{
      id: string;
      time: number;
      scale?: number;
      x?: number;
      y?: number;
      opacity?: number;
    }>;
  };
  name?: string;
  exportSettings: {
    resolution: '720p' | '1080p' | '4k';
    format: 'mp4';
    fps: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
    clipId: { type: Schema.Types.ObjectId, ref: 'Clip', index: true },
    name: { type: String, default: 'Untitled Project', trim: true },
    edits: {
      startTime: { type: Number, default: 0 },
      endTime: { type: Number, default: 15 },
      aspectRatio: { type: String, enum: ['9:16', '16:9', '1:1', '4:5', 'original'], default: '9:16' },
      filter: {
        type: String,
        enum: [
          'normal',
          'bright',
          'contrast',
          'cinematic',
          'warm',
          'cool',
          'vibrant',
          'vintage',
          'faded',
          'dramatic',
          'cyberpunk',
          'grayscale',
        ],
        default: 'normal',
      },
      filterIntensity: { type: Number, default: 100 },
      adjustments: {
        brightness: { type: Number, default: 0 },
        contrast: { type: Number, default: 0 },
        saturation: { type: Number, default: 0 },
        warmth: { type: Number, default: 0 },
        vignette: { type: Number, default: 0 },
      },
      stickers: [
        {
          id: String,
          type: { type: String, default: 'badge' },
          content: String,
          label: String,
          x: { type: Number, default: 50 },
          y: { type: Number, default: 50 },
          scale: { type: Number, default: 1 },
          rotation: { type: Number, default: 0 },
          startTime: Number,
          endTime: Number,
        },
      ],
      speed: { type: Number, default: 1.0 },
      volume: { type: Number, default: 100 },
      overlayMusic: {
        url: String,
        fileName: String,
        originalName: String,
        name: String,
        volume: { type: Number, default: 50 },
        loop: { type: Boolean, default: true },
        startTime: { type: Number, default: 0 },
        fadeIn: { type: Number, default: 0 },
        fadeOut: { type: Number, default: 0 },
      },
      textOverlays: [
        {
          id: String,
          text: String,
          fontSize: { type: Number, default: 28 },
          color: { type: String, default: '#ffffff' },
          position: { type: String, enum: ['top', 'center', 'bottom', 'custom'], default: 'top' },
          xPercent: Number,
          yPercent: Number,
          isBold: { type: Boolean, default: true },
          alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
          startTime: { type: Number, default: 0 },
          endTime: { type: Number, default: 15 },
          fontFamily: String,
          fontWeight: Schema.Types.Mixed,
          lineHeight: Number,
          outlineColor: String,
          outlineWidth: Number,
          shadowStyle: String,
          shadowColor: String,
          backgroundColor: String,
          backgroundOpacity: Number,
          isUppercase: Boolean,
          letterSpacing: Number,
          animation: String,
          animationDuration: Number,
          animationDelay: Number,
          animationIntensity: Number,
        },
      ],
      transition: {
        type: { type: String, default: 'none' },
        duration: { type: Number, default: 0.5 },
        position: { type: String, enum: ['start', 'end', 'both'], default: 'start' },
      },
      effect: {
        type: { type: String, default: 'none' },
        intensity: { type: Number, default: 50 },
        speed: { type: Number, default: 1.0 },
      },
      soundEffects: [
        {
          id: String,
          name: String,
          category: String,
          time: Number,
          volume: Number,
          type: { type: String },
        },
      ],
      voiceEffect: {
        type: { type: String, default: 'none' },
        intensity: { type: Number, default: 80 },
      },
      watermark: {
        enabled: { type: Boolean, default: false },
        url: String,
        text: String,
        x: { type: Number, default: 85 },
        y: { type: Number, default: 10 },
        scale: { type: Number, default: 1.0 },
        opacity: { type: Number, default: 80 },
      },
      speedCurve: {
        mode: { type: String, default: 'constant' },
        curvePoints: [
          {
            progress: Number,
            speed: Number,
          },
        ],
      },
      keyframes: [
        {
          id: String,
          time: Number,
          scale: Number,
          x: Number,
          y: Number,
          opacity: Number,
        },
      ],
    },
    exportSettings: {
      resolution: { type: String, enum: ['720p', '1080p', '4k'], default: '1080p' },
      format: { type: String, default: 'mp4' },
      fps: { type: Number, default: 30 },
    },
  },
  { timestamps: true }
);

ProjectSchema.index({ userId: 1, clipId: 1 });
ProjectSchema.index({ userId: 1, updatedAt: -1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
