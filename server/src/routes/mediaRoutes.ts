import { Router } from 'express';
import { streamMediaFile } from '../controllers/mediaController.js';

const router = Router();

router.get('/stream', streamMediaFile);
router.get('/stream/:fileName', streamMediaFile);

export default router;
