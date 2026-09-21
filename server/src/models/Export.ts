import mongoose, { Schema, Document } from 'mongoose';

export interface IExport extends Document {
  userId: mongoose.Types.ObjectId;
  clipId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: string;
  resolution: string;
  aspectRatio: string;
  fileKey: string;
  fileSize: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

const ExportSchema = new Schema<IExport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clipId: { type: Schema.Types.ObjectId, ref: 'Clip', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    format: { type: String, default: 'mp4' },
    resolution: { type: String, default: '1080p' },
    aspectRatio: { type: String, default: '9:16' },
    fileKey: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    error: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ExportSchema.index({ userId: 1, createdAt: -1 });

export const Export = mongoose.model<IExport>('Export', ExportSchema);
