"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Waitlist signup (public)
router.post('/create-waitlist', adminController_1.createWaitlist);
// admin controls (Authenticated)
router.get('/admin/users', auth_1.authMiddleware, adminController_1.getadminUsers);
router.get('/admin/user/:userId', auth_1.authMiddleware, adminController_1.getadminUserById);
router.post('/admin/user/toggle-top-lender/:userId', auth_1.authMiddleware, adminController_1.toggleTopLender);
router.post('/admin/user/:userId/update-status', auth_1.authMiddleware, adminController_1.updateUserStatus);
router.post('/admin/users/bulk/action', auth_1.authMiddleware, adminController_1.bulkUpdateUsers);
router.get('/admin/transactions', auth_1.authMiddleware, adminController_1.getadminTransactions);
router.get('/admin/waitlists', auth_1.authMiddleware, adminController_1.getadminWaitlists);
router.post('/admin/waitlists/:id', auth_1.authMiddleware, adminController_1.moderateWaitlist);
router.post('/admin/waitlists/bulk/action', auth_1.authMiddleware, adminController_1.bulkModerateWaitlists);
router.get('/admin/payouts/stats/dashboard', auth_1.authMiddleware, adminController_1.getadminPayoutStats);
router.get('/admin/payouts', auth_1.authMiddleware, adminController_1.getadminPayouts);
exports.default = router;
