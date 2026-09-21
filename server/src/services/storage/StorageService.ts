import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { config } from '../../config/environment.js';
import { logger } from '../../utils/logger.js';

export interface IStorageService {
  upload(key: string, fileSource: string | Buffer, contentType?: string): Promise<string>;
  download(key: string, localDestPath: string): Promise<string>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
  getLocalPath(key: string): string;
}

/**
 * Local disk storage provider (default for development and local testing)
 */
export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.resolve(config.uploadDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  public getLocalPath(key: string): string {
    // Prevent directory traversal attacks
    const safeKey = key.replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');
    return path.join(this.baseDir, ...safeKey.split('/'));
  }

  public async upload(key: string, fileSource: string | Buffer, contentType?: string): Promise<string> {
    const destPath = this.getLocalPath(key);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    if (typeof fileSource === 'string') {
      // Source is a local file path
      if (fileSource !== destPath) {
        fs.copyFileSync(fileSource, destPath);
      }
    } else {
      // Source is a Buffer
      fs.writeFileSync(destPath, fileSource);
    }

    logger.debug(`[LocalStorageService] Uploaded ${key} to ${destPath}`);
    return key;
  }

  public async download(key: string, localDestPath: string): Promise<string> {
    const srcPath = this.getLocalPath(key);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`[LocalStorageService] File not found for key: ${key}`);
    }

    if (srcPath !== localDestPath) {
      const destDir = path.dirname(localDestPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, localDestPath);
    }
    return localDestPath;
  }

  public async delete(key: string): Promise<void> {
    const filePath = this.getLocalPath(key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.debug(`[LocalStorageService] Deleted ${key}`);
    }
  }

  public async exists(key: string): Promise<boolean> {
    return fs.existsSync(this.getLocalPath(key));
  }

  public async getSignedUrl(key: string, _expiresInSeconds = 3600): Promise<string> {
    // Returns the streaming endpoint path for the frontend
    const safeKey = encodeURIComponent(key.replace(/\\/g, '/'));
    return `/api/media/stream?key=${safeKey}`;
  }
}

/**
 * AWS S3 Storage Provider (for production)
 */
export class S3StorageService implements IStorageService {
  private s3Client: any = null;
  private bucket: string;

  constructor() {
    this.bucket = config.aws.bucket;
  }

  private async getClient() {
    if (!this.s3Client) {
      const { S3Client } = await import('@aws-sdk/client-s3');
      this.s3Client = new S3Client({
        region: config.aws.region,
        credentials: {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        },
      });
    }
    return this.s3Client;
  }

  public getLocalPath(key: string): string {
    // For S3, return a temporary cache path in uploadDir
    return path.join(config.uploadDir, 's3-cache', ...key.split('/'));
  }

  public async upload(key: string, fileSource: string | Buffer, contentType = 'video/mp4'): Promise<string> {
    const client = await this.getClient();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    let body: Buffer;
    if (typeof fileSource === 'string') {
      body = fs.readFileSync(fileSource);
    } else {
      body = fileSource;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await client.send(command);
    logger.info(`[S3StorageService] Uploaded ${key} to s3://${this.bucket}`);
    return key;
  }

  public async download(key: string, localDestPath: string): Promise<string> {
    const client = await this.getClient();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');

    const destDir = path.dirname(localDestPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await client.send(command);
    if (!response.Body) {
      throw new Error(`[S3StorageService] Empty response body for s3://${this.bucket}/${key}`);
    }

    const writeStream = fs.createWriteStream(localDestPath);
    await pipeline(response.Body as any, writeStream);
    return localDestPath;
  }

  public async delete(key: string): Promise<void> {
    const client = await this.getClient();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await client.send(command);
    logger.info(`[S3StorageService] Deleted s3://${this.bucket}/${key}`);
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
      await client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  public async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const client = await this.getClient();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(client, command, { expiresIn });
  }
}

/**
 * Storage Key Helpers ensuring strict multi-tenant user isolation
 */
export const StorageKeys = {
  userVideo(userId: string, videoId: string, filename: string): string {
    const ext = path.extname(filename) || '.mp4';
    const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `users/${userId}/videos/${videoId}/${base}${ext}`;
  },
  userClip(userId: string, clipId: string, filename = 'clip.mp4'): string {
    return `users/${userId}/clips/${clipId}/${filename}`;
  },
  userThumbnail(userId: string, id: string): string {
    return `users/${userId}/thumbnails/${id}.jpg`;
  },
  userExport(userId: string, jobId: string, ext = '.mp4'): string {
    return `users/${userId}/exports/${jobId}${ext}`;
  },
};

// Initialize the active storage driver
export const storageService: IStorageService =
  config.storageDriver === 's3' && config.aws.accessKeyId
    ? new S3StorageService()
    : new LocalStorageService();
