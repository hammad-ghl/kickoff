import { Router } from 'express';
import {
  createReview,
  getReview,
  updateReview,
  deleteReview,
  getAllReviews,
  analyzeReview,
} from '../controllers/reviewController';

const router = Router();

router.get('/', getAllReviews);
router.post('/', createReview);
router.get('/:id', getReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/analyze', analyzeReview);

export default router;
