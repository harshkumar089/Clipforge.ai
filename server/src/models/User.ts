import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  googleId?: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  avatar?: string;
  provider: 'google' | 'local';
  password?: string;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    avatar: { type: String, default: '' },
    provider: { type: String, enum: ['google', 'local'], default: 'google', index: true },
    password: { type: String, minlength: 6 },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Synchronize avatar and profilePicture
UserSchema.pre('save', async function (next) {
  if (this.profilePicture && !this.avatar) {
    this.avatar = this.profilePicture;
  } else if (this.avatar && !this.profilePicture) {
    this.profilePicture = this.avatar;
  }

  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
