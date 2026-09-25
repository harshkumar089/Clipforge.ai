import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/environment.js';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import clipRoutes from './routes/clipRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import audioRoutes from './routes/audioRoutes.js';

const app = express();

app.use(cookieParser());

// Security and CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.) or matching client
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ClipForge API',
    timestamp: new Date().toISOString(),
    ffmpeg: config.ffmpegPath,
    ffprobe: config.ffprobePath,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/audio', audioRoutes);
// Serve static frontend assets if built
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      logger.info(`===============================================`);
      logger.info(`  ClipForge Server running on port ${config.port}`);
      logger.info(`  API: http://localhost:${config.port}/api`);
      logger.info(`===============================================`);
    });

    // Disable socket timeouts so large multi-gigabyte uploads are not dropped
    server.timeout = 0;
    server.keepAliveTimeout = 300000;
    server.headersTimeout = 305000;
    if ('requestTimeout' in server) {
      (server as any).requestTimeout = 0;
    }
  } catch (err: any) {
    logger.error('Fatal: Failed to start ClipForge server:', err.message);
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();


