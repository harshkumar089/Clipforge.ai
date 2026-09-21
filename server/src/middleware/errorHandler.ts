import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Unhandled API Error:', err.stack || err.message || err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxGb = (config.maxFileSize / (1024 * 1024 * 1024)).toFixed(1).replace('.0', '');
      res.status(400).json({
        success: false,
        message: `File is too large. Maximum allowed file size is ${maxGb}GB.`,
      });
      return;
    }
    res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong while processing your request. Please try again.';

  res.status(statusCode).json({
    success: false,
    message,
  });
};
