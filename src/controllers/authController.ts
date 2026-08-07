import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Cart from '../models/Cart';
import Wishlist from '../models/Wishlist';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, city, PostalCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user. Default to active status, and primary address
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'buyer',
      status: 'Active',
      addresses: city && PostalCode ? [{
        label: 'Home',
        street_name: 'Default Street',
        house_number: '1',
        city,
        postal_code: PostalCode,
        is_primary: true
      }] : []
    });

    await newUser.save();

    // Create Cart and Wishlist for user
    await new Cart({ user: newUser._id, items: [] }).save();
    await new Wishlist({ user: newUser._id, products: [] }).save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        switch_account: user.switch_account,
        is_switched: user.is_switched
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Switch account between renter (user) and lender (lender)
export const switchAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Toggle role between 'buyer' and 'seller'
    const newRole = user.role === 'buyer' ? 'seller' : 'buyer';
    user.role = newRole;
    user.is_switched = !user.is_switched;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        switch_account: user.switch_account,
        is_switched: user.is_switched
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      user
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Mock OTP verification endpoints
export const sendOtp = (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Mock OTP code sent to your email',
    otpExpiresIn: 300
  });
};

export const verifyOtp = async (req: Request, res: Response) => {
  // Mock verification, auto registers/logs in
  const { email, otp, type } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  // Return mock successful verification
  let user = await User.findOne({ email });
  if (!user) {
    // If signup verify otp, create user
    const mockPassword = await bcrypt.hash('password123', 10);
    user = new User({
      name: email.split('@')[0],
      email,
      password: mockPassword,
      role: 'buyer',
      status: 'Active'
    });
    await user.save();
    await new Cart({ user: user._id, items: [] }).save();
    await new Wishlist({ user: user._id, products: [] }).save();
  }

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    success: true,
    message: 'OTP verified successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// Mock KYC start
export const startKyc = (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      kyc_id: 'kyc_' + Math.random().toString(36).substr(2, 9),
      session_id: 'sess_' + Math.random().toString(36).substr(2, 9),
      session_url: 'https://verify.navyaa-kyc-mock.com/verify'
    }
  });
};

// Mock forgot/reset passwords
export const forgotPassword = (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Mock reset email sent'
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Password reset successful'
  });
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const primaryAddressObj = user.addresses.find(addr => addr.is_primary);
    const primaryAddressStr = primaryAddressObj
      ? `${primaryAddressObj.house_number} ${primaryAddressObj.street_name}, ${primaryAddressObj.city}`
      : '';

    return res.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        address: primaryAddressStr,
        addresses: user.addresses || [],
        phone: user.phone || null,
        profile_image: user.profile_image || null,
        bio: user.bio || null,
        status: user.status || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, phone, bio, address, addresses } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    if (addresses) {
      try {
        user.addresses = typeof addresses === 'string' ? JSON.parse(addresses) : addresses;
      } catch (e) {
        // Ignore JSON parse error or handle it
      }
    }

    if (req.file) {
      user.profile_image = '/uploads/' + req.file.filename;
    }

    await user.save();

    const primaryAddressObj = user.addresses.find(addr => addr.is_primary);
    const primaryAddressStr = primaryAddressObj
      ? `${primaryAddressObj.house_number} ${primaryAddressObj.street_name}, ${primaryAddressObj.city}`
      : '';

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        name: user.name,
        email: user.email,
        address: primaryAddressStr,
        addresses: user.addresses || [],
        phone: user.phone || null,
        profile_image: user.profile_image || null,
        bio: user.bio || null,
        status: user.status || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRenterAddresses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      data: {
        addresses: user.addresses || []
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addRenterAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { label, street_name, house_number, house_number_suffix, city, postal_code, is_primary } = req.body;

    const newAddress: any = {
      label,
      street_name,
      house_number,
      house_number_suffix,
      city,
      postal_code,
      is_primary: !!is_primary
    };

    if (is_primary) {
      user.addresses.forEach(addr => {
        addr.is_primary = false;
      });
    }

    user.addresses.push(newAddress);
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRenterAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const addressId = req.params.id;
    const address = user.addresses.find(addr => addr._id && addr._id.toString() === addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    const { label, street_name, house_number, house_number_suffix, city, postal_code, is_primary } = req.body;

    if (label !== undefined) address.label = label;
    if (street_name !== undefined) address.street_name = street_name;
    if (house_number !== undefined) address.house_number = house_number;
    if (house_number_suffix !== undefined) address.house_number_suffix = house_number_suffix;
    if (city !== undefined) address.city = city;
    if (postal_code !== undefined) address.postal_code = postal_code;

    if (is_primary !== undefined) {
      address.is_primary = !!is_primary;
      if (is_primary) {
        user.addresses.forEach(addr => {
          if (addr._id && addr._id.toString() !== addressId) {
            addr.is_primary = false;
          }
        });
      }
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRenterAddress = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const addressId = req.params.id;
    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter(addr => addr._id && addr._id.toString() !== addressId);

    if (user.addresses.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Address deleted successfully',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
