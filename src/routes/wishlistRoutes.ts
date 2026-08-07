import { Router } from 'express';
import { 
  getWishlist, 
  addToWishlist, 
  removeFromWishlist, 
  updateWishlist 
} from '../controllers/wishlistController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/renter/wishlists', authMiddleware, getWishlist);
router.post('/renter/wishlist', authMiddleware, addToWishlist);
router.delete('/renter/wishlist/:productId/delete', authMiddleware, removeFromWishlist);
router.post('/renter/wishlists', authMiddleware, updateWishlist);

export default router;
