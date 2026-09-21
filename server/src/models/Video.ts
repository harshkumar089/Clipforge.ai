import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  originalFileName: string;
  storageKey: string;
  thumbnailKey?: string;
  filePath?: string;
  thumbnailPath?: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  mimeType?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  processingProgress?: number; // 0 - 100%
  clipCount: number;
  metadata?: {
    width?: number;
    height?: number;
    codec?: string;
    fps?: number;
    bitrate?: number;
    hasAudio?: boolean;
  };
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true },
    storageKey: { type: String, required: true, index: true },
    thumbnailKey: { type: String, default: '' },
    filePath: { type: String, default: '' },
    thumbnailPath: { type: String, default: '' },
    duration: { type: Number, required: true, default: 0 },
    fileSize: { type: Number, required: true, default: 0 },
    mimeType: { type: String, default: 'video/mp4' },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    processingProgress: { type: Number, default: 0 },
    clipCount: { type: Number, default: 0 },
    metadata: {
      width: Number,
      height: Number,
      codec: String,
      fps: Number,
      bitrate: Number,
      hasAudio: Boolean,
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

VideoSchema.index({ userId: 1, createdAt: -1 });

export const Video = mongoose.model<IVideo>('Video', VideoSchema);
