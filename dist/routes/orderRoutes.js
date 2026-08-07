"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/renter/create-order', auth_1.authMiddleware, orderController_1.createOrder);
router.post('/renter/create-checkout-session/:transactionId', auth_1.authMiddleware, orderController_1.createCheckoutSession);
router.get('/renter/my-bookings', auth_1.authMiddleware, orderController_1.getRenterBookings);
router.get('/bookings/:id', auth_1.authMiddleware, orderController_1.getRenterBookingDetail);
router.get('/renter/my-bookings/:id/tracking', auth_1.authMiddleware, orderController_1.getTrackingInfo);
router.post('/renter/confirm-delivery/:id', auth_1.authMiddleware, orderController_1.confirmDelivery);
router.post('/renter/cancel-order/:id', auth_1.authMiddleware, orderController_1.cancelOrder);
router.post('/renter/return-order/:id', auth_1.authMiddleware, orderController_1.returnOrder);
// seller endpoints
router.get('/lender/orders', auth_1.authMiddleware, orderController_1.getLenderOrders);
router.post('/lender/orders/:orderId/status', auth_1.authMiddleware, orderController_1.updateOrderStatus);
router.post('/lender/orders/:orderId/extension/respond', auth_1.authMiddleware, orderController_1.respondExtension);
exports.default = router;
