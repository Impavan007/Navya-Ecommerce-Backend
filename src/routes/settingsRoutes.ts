import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/setting', getSettings);
router.post('/admin/setting', authMiddleware, updateSettings);

export default router;
