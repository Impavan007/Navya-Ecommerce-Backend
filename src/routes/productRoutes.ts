import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllProducts,
  getProductById,
  getSimilarAndMore,
  getSearchSuggestions,
  getLenderProducts,
  getProductsByLender,
  saveListingStep,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  deleteProductImage,
  bulkListingAction
} from '../controllers/productController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Ensure Productimages directory exists
const productImagesDir = path.join(__dirname, '../../Productimages');
if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'productImages', maxCount: 10 }
]);

// Public endpoints
router.get('/products', getAllProducts);
router.get('/products/search', getAllProducts);
router.get('/products/search/suggestions', getSearchSuggestions);
router.get('/product/:id', getProductById);
router.get('/products/similar-and-more/:id', getSimilarAndMore);
router.get('/product-bylender/:lenderId', getProductsByLender);

// seller endpoints (Authenticated)
router.get('/lender/products', authMiddleware, getLenderProducts);
router.post('/lender/listing/step', authMiddleware, uploadFields, saveListingStep);
router.post('/lender/product/:id/update', authMiddleware, uploadFields, updateProduct);
router.post('/lender/product/:id/status', authMiddleware, updateProductStatus);
router.delete('/lender/product/:id/delete', authMiddleware, deleteProduct);
router.post('/lender/product/:id/image/delete', authMiddleware, deleteProductImage);
router.post('/lender/products/bulk/action', authMiddleware, bulkListingAction);

export default router;
