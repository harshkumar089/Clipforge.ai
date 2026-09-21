import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  getProjectByClipId,
  saveProject,
  deleteProject,
} from '../controllers/projectController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProjects);
router.get('/clip/:clipId', getProjectByClipId);
router.get('/:id', getProjectById);
router.post('/', saveProject);
router.put('/:id', saveProject);
router.delete('/:id', deleteProject);

export default router;
