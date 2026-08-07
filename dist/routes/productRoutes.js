"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Ensure Productimages directory exists
const productImagesDir = path_1.default.join(__dirname, '../../Productimages');
if (!fs_1.default.existsSync(productImagesDir)) {
    fs_1.default.mkdirSync(productImagesDir, { recursive: true });
}
// Multer storage engine configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productImagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
const uploadFields = upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'productImages', maxCount: 10 }
]);
// Public endpoints
router.get('/products', productController_1.getAllProducts);
router.get('/products/search', productController_1.getAllProducts);
router.get('/products/search/suggestions', productController_1.getSearchSuggestions);
router.get('/product/:id', productController_1.getProductById);
router.get('/products/similar-and-more/:id', productController_1.getSimilarAndMore);
router.get('/product-bylender/:lenderId', productController_1.getProductsByLender);
// seller endpoints (Authenticated)
router.get('/lender/products', auth_1.authMiddleware, productController_1.getLenderProducts);
router.post('/lender/listing/step', auth_1.authMiddleware, uploadFields, productController_1.saveListingStep);
router.post('/lender/product/:id/update', auth_1.authMiddleware, uploadFields, productController_1.updateProduct);
router.post('/lender/product/:id/status', auth_1.authMiddleware, productController_1.updateProductStatus);
router.delete('/lender/product/:id/delete', auth_1.authMiddleware, productController_1.deleteProduct);
router.post('/lender/product/:id/image/delete', auth_1.authMiddleware, productController_1.deleteProductImage);
router.post('/lender/products/bulk/action', auth_1.authMiddleware, productController_1.bulkListingAction);
exports.default = router;
