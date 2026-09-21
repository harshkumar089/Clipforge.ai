import { Router } from 'express';
import {
  exportClip,
  getExportStatus,
  downloadExportedFile,
  batchExportClips,
  getBatchExportStatus,
  downloadBatchZip,
} from '../controllers/exportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Downloading exported file or batch zip can be accessed directly or with auth
router.get('/download/:fileName', downloadExportedFile);
router.get('/batch/:batchId/zip', downloadBatchZip);

router.use(authenticate);
router.post('/clips/:id/export', exportClip);
router.get('/status/:jobId', getExportStatus);
router.post('/batch', batchExportClips);
router.get('/batch/:batchId', getBatchExportStatus);

export default router;
