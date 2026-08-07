import { Router } from 'express';
import { 
  getProductReviews, 
  renterCreateReview, 
  getLenderReviews 
} from '../controllers/reviewController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/product/:id/reviews', getProductReviews);
router.post('/renter/create-review', authMiddleware, renterCreateReview);
router.get('/lender/reviews', authMiddleware, getLenderReviews);

export default router;
