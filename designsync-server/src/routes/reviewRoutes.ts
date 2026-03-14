import { Router } from 'express';
import {
  createReview,
  getReview,
  updateReview,
  deleteReview,
  getAllReviews,
  analyzeReview,
  reAnalyzeReview,
} from '../controllers/reviewController';

const router = Router();

router.get('/', getAllReviews);
router.post('/', createReview);
router.get('/:id', getReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/analyze', analyzeReview);
router.post('/:id/reanalyze', reAnalyzeReview);

export default router;
