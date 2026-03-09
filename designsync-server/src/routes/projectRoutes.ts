import { Router } from 'express';
import {
  createProject,
  getProject,
  getAllProjects,
  updateProject,
  deleteProject,
  generateCases,
  getProjectReviews,
} from '../controllers/projectController';

const router = Router();

router.post('/', createProject);
router.get('/', getAllProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

router.post('/:id/generate-cases', generateCases);
router.get('/:id/reviews', getProjectReviews);

export default router;
