import { Router } from 'express';
import { getClips, getClipById, updateClip, deleteClip } from '../controllers/clipController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getClips);
router.get('/:id', getClipById);
router.put('/:id', updateClip);
router.delete('/:id', deleteClip);

export default router;

