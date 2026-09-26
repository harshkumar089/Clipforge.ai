import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Search potential .env locations in order of priority:
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '../.env'),
  typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../.env') : '',
  typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../../.env') : '',
].filter(Boolean);

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}


export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) || 'mongodb://127.0.0.1:27017/clipforge',
  jwtSecret: process.env.JWT_SECRET || 'clipforge_jwt_fallback_secret_key_2026',
  cookieName: 'clipforge_auth',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  storageDriver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'clipforge-videos',
  },
  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || '../uploads'),
  outputDir: path.resolve(process.cwd(), process.env.OUTPUT_DIR || '../outputs'),
  thumbnailDir: path.resolve(process.cwd(), process.env.THUMBNAIL_DIR || '../thumbnails'),
  maxVideoDuration: parseInt(process.env.MAX_VIDEO_DURATION || '14400', 10), // 4 hours in seconds
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5368709120', 10), // 5GB
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
};
