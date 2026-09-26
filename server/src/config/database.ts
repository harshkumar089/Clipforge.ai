import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './environment.js';
import { logger } from '../utils/logger.js';

const maskMongoUri = (uri: string): string => {
  try {
    return uri.replace(/\/\/[^@]+@/, '//***:***@');
  } catch {
    return '***';
  }
};

let mongod: MongoMemoryServer | null = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Attempt connecting to the configured MongoDB instance
    logger.info(`Attempting to connect to MongoDB at ${maskMongoUri(config.mongoUri)}...`);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    logger.info('Connected to MongoDB successfully.');
  } catch (primaryErr: any) {
    logger.warn(`Could not connect to external MongoDB: ${primaryErr.message}. Initializing local in-memory MongoDB runner...`);
    try {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      logger.info(`Connected to in-memory MongoDB instance at ${uri}`);
    } catch (memErr) {
      logger.error('Failed to initialize in-memory MongoDB:', memErr);
      throw memErr;
    }
  }

  // Ensure default demo user exists
  try {
    const { User } = await import('../models/User.js');
    const existing = await User.findOne({ email: 'demo@clipforge.com' });
    if (!existing) {
      const demoUser = new User({
        email: 'demo@clipforge.com',
        password: 'password123',
        name: 'Demo Creator',
        plan: 'pro',
      });
      await demoUser.save();
      logger.info('Default demo user seeded: demo@clipforge.com / password123');
    }
  } catch (seedErr: any) {
    logger.warn('Could not auto-seed demo user:', seedErr.message);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};
