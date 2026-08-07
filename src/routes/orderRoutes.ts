import { Router } from 'express';
import {
  createOrder,
  createCheckoutSession,
  getRenterBookings,
  getRenterBookingDetail,
  getLenderOrders,
  updateOrderStatus,
  confirmDelivery,
  cancelOrder,
  returnOrder,
  respondExtension,
  getTrackingInfo
} from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/renter/create-order', authMiddleware, createOrder);
router.post('/renter/create-checkout-session/:transactionId', authMiddleware, createCheckoutSession);
router.get('/renter/my-bookings', authMiddleware, getRenterBookings);
router.get('/bookings/:id', authMiddleware, getRenterBookingDetail);
router.get('/renter/my-bookings/:id', authMiddleware, getRenterBookingDetail);
router.get('/renter/my-bookings/:id/tracking', authMiddleware, getTrackingInfo);

router.post('/renter/confirm-delivery/:id', authMiddleware, confirmDelivery);
router.post('/renter/cancel-order/:id', authMiddleware, cancelOrder);
router.post('/renter/return-order/:id', authMiddleware, returnOrder);

// seller endpoints
router.get('/lender/orders', authMiddleware, getLenderOrders);
router.post('/lender/orders/:orderId/status', authMiddleware, updateOrderStatus);
router.post('/lender/orders/:orderId/extension/respond', authMiddleware, respondExtension);

export default router;
