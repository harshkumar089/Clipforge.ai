import { Router } from 'express';
import { uploadAudio, getAudioPresets } from '../controllers/audioController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAudioMiddleware } from '../middleware/audioUpload.js';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadAudioMiddleware.single('audio'), uploadAudio);
router.get('/presets', getAudioPresets);

export default router;
