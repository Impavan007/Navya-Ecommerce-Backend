import { Router } from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart, 
  getCartCount,
  calculateCheckout
} from '../controllers/cartController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/renter/cart', authMiddleware, getCart);
router.post('/renter/cart', authMiddleware, addToCart);
router.post('/renter/cart/:id', authMiddleware, updateCartItem);
router.delete('/renter/cart/:productId', authMiddleware, removeFromCart);
router.delete('/renter/clear-cart', authMiddleware, clearCart);
router.get('/cart/count', authMiddleware, getCartCount);

router.post('/renter/checkout/calculate', authMiddleware, calculateCheckout);

export default router;
