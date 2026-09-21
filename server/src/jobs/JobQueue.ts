import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Job<T = any, R = any> {
  id: string;
  type: 'analyze_and_clip' | 'render_export' | 'batch_export';
  status: JobStatus;
  progress: number;
  message: string;
  data: T;
  result?: R;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class JobQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private isProcessing = false;
  private queue: string[] = [];

  constructor() {
    super();
  }

  public addJob<T>(type: Job['type'], data: T): Job<T> {
    const id = uuidv4();
    const job: Job<T> = {
      id,
      type,
      status: 'queued',
      progress: 0,
      message: 'Job queued for processing',
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(id, job);
    this.queue.push(id);
    logger.info(`Job ${id} (${type}) added to queue.`);

    // Trigger processing
    setTimeout(() => this.processNext(), 10);
    return job;
  }

  public getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  public updateJobProgress(id: string, progress: number, message?: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.progress = Math.max(0, Math.min(100, Math.round(progress)));
      if (message) job.message = message;
      job.updatedAt = new Date();
      this.emit('progress', job);
    }
  }

  public completeJob(id: string, result: any, message = 'Completed successfully'): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.message = message;
      job.result = result;
      job.updatedAt = new Date();
      this.emit('completed', job);
      logger.info(`Job ${id} (${job.type}) finished: ${message}`);
    }
  }

  public failJob(id: string, errorMsg: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'failed';
      job.error = errorMsg;
      job.message = errorMsg;
      job.updatedAt = new Date();
      this.emit('failed', job);
      logger.error(`Job ${id} (${job.type}) failed: ${errorMsg}`);
    }
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const jobId = this.queue.shift()!;
    const job = this.jobs.get(jobId);

    if (!job) {
      this.isProcessing = false;
      this.processNext();
      return;
    }

    job.status = 'processing';
    job.updatedAt = new Date();

    try {
      this.emit('start', job);
      // Handled by subscribers registering handlers on 'start' or direct runner
    } catch (err: any) {
      this.failJob(jobId, err.message || 'Unknown processing error');
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }
}

export const jobQueue = new JobQueue();
