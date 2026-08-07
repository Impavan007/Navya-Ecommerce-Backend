import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  register, 
  login, 
  getCurrentUser, 
  sendOtp, 
  verifyOtp, 
  switchAccount, 
  startKyc,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getRenterAddresses,
  addRenterAddress,
  updateRenterAddress,
  deleteRenterAddress
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/register', register);
router.post('/login', login);
router.get('/auth/me', authMiddleware, getCurrentUser);
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/switch-account', authMiddleware, switchAccount);
router.post('/kyc/start', authMiddleware, startKyc);

// Profile endpoints
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile/update', authMiddleware, updateUserProfile);
router.post('/profile', authMiddleware, upload.single('profileImage'), updateUserProfile);

// Address endpoints
router.get('/renter/addresses', authMiddleware, getRenterAddresses);
router.post('/renter/addresses', authMiddleware, addRenterAddress);
router.post('/renter/addresses/:id', authMiddleware, updateRenterAddress);
router.delete('/renter/addresses/:id', authMiddleware, deleteRenterAddress);

// Mock endpoints for configuration verification
router.get('/google-oauth-url', (req, res) => res.json({ success: true, url: 'https://accounts.google.com' }));
router.post('/set-password', (req, res) => res.json({ success: true, message: 'Password set successfully' }));

export default router;
