import mongoose, { Schema, Document } from 'mongoose';

export interface IClip extends Document {
  userId: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  reason: string;
  fileKey: string;
  thumbnailKey?: string;
  filePath?: string;
  thumbnailPath?: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | 'original';
  status: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClipSchema = new Schema<IClip>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    videoId: { type: Schema.Types.ObjectId, ref: 'Video', required: true, index: true },
    title: { type: String, required: true, trim: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    duration: { type: Number, required: true },
    score: { type: Number, default: 0.8 },
    reason: { type: String, default: 'Key highlight segment' },
    fileKey: { type: String, default: '', index: true },
    thumbnailKey: { type: String, default: '' },
    filePath: { type: String, default: '' },
    thumbnailPath: { type: String, default: '' },
    aspectRatio: {
      type: String,
      enum: ['9:16', '16:9', '1:1', 'original'],
      default: '9:16',
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

ClipSchema.index({ userId: 1, videoId: 1, createdAt: -1 });

export const Clip = mongoose.model<IClip>('Clip', ClipSchema);
