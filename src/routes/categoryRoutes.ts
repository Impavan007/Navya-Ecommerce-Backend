import { Router } from 'express';
import { getCategories, getSubCategories, createCategory } from '../controllers/categoryController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/categories', getCategories);
router.get('/categories/:categoryId/sub-categories', getSubCategories);
router.post('/categories', authMiddleware, createCategory);

export default router;
