import { Router } from 'express';
import {
  uploadVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  analyzeVideo,
  generateClips,
  getProcessingStatus,
} from '../controllers/videoController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadVideoMiddleware } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadVideoMiddleware.single('video'), uploadVideo);
router.get('/', getVideos);
router.get('/:id', getVideoById);
router.delete('/:id', deleteVideo);
router.post('/:id/analyze', analyzeVideo);
router.post('/:id/generate-clips', generateClips);
router.get('/:id/processing-status', getProcessingStatus);

export default router;
