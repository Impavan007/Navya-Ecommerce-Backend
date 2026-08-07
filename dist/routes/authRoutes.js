"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Ensure upload directory exists
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Multer storage configuration for profile images
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.get('/auth/me', auth_1.authMiddleware, authController_1.getCurrentUser);
router.post('/auth/send-otp', authController_1.sendOtp);
router.post('/auth/verify-otp', authController_1.verifyOtp);
router.post('/auth/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
router.post('/switch-account', auth_1.authMiddleware, authController_1.switchAccount);
router.post('/kyc/start', auth_1.authMiddleware, authController_1.startKyc);
// Profile endpoints
router.get('/profile', auth_1.authMiddleware, authController_1.getUserProfile);
router.put('/profile/update', auth_1.authMiddleware, authController_1.updateUserProfile);
router.post('/profile', auth_1.authMiddleware, upload.single('profileImage'), authController_1.updateUserProfile);
// Address endpoints
router.get('/renter/addresses', auth_1.authMiddleware, authController_1.getRenterAddresses);
router.post('/renter/addresses', auth_1.authMiddleware, authController_1.addRenterAddress);
router.post('/renter/addresses/:id', auth_1.authMiddleware, authController_1.updateRenterAddress);
router.delete('/renter/addresses/:id', auth_1.authMiddleware, authController_1.deleteRenterAddress);
// Mock endpoints for configuration verification
router.get('/google-oauth-url', (req, res) => res.json({ success: true, url: 'https://accounts.google.com' }));
router.post('/set-password', (req, res) => res.json({ success: true, message: 'Password set successfully' }));
exports.default = router;
