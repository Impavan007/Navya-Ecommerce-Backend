import { Router } from 'express';
import {
  getadminUsers,
  getadminUserById,
  toggleTopLender,
  updateUserStatus,
  bulkUpdateUsers,
  getadminTransactions,
  createWaitlist,
  getadminWaitlists,
  moderateWaitlist,
  bulkModerateWaitlists,
  getadminPayoutStats,
  getadminPayouts
} from '../controllers/adminController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Waitlist signup (public)
router.post('/create-waitlist', createWaitlist);

// admin controls (Authenticated)
router.get('/admin/users', authMiddleware, getadminUsers);
router.get('/admin/user/:userId', authMiddleware, getadminUserById);
router.post('/admin/user/toggle-top-lender/:userId', authMiddleware, toggleTopLender);
router.post('/admin/user/:userId/update-status', authMiddleware, updateUserStatus);
router.post('/admin/users/bulk/action', authMiddleware, bulkUpdateUsers);

router.get('/admin/transactions', authMiddleware, getadminTransactions);

router.get('/admin/waitlists', authMiddleware, getadminWaitlists);
router.post('/admin/waitlists/:id', authMiddleware, moderateWaitlist);
router.post('/admin/waitlists/bulk/action', authMiddleware, bulkModerateWaitlists);

router.get('/admin/payouts/stats/dashboard', authMiddleware, getadminPayoutStats);
router.get('/admin/payouts', authMiddleware, getadminPayouts);

export default router;
