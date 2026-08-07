import { Router } from 'express';
import {
  getLenderDashboard,
  getLenderEarningsOverview,
  getLenderTransactions,
  getadminDashboard
} from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/lender/dashboard', authMiddleware, getLenderDashboard);
router.get('/lender/earnings/overview', authMiddleware, getLenderEarningsOverview);
router.get('/lender/earnings/transactions', authMiddleware, getLenderTransactions);

router.get('/admin/dashboard', authMiddleware, getadminDashboard);

export default router;
