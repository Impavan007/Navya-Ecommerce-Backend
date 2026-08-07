"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRenterAddress = exports.updateRenterAddress = exports.addRenterAddress = exports.getRenterAddresses = exports.updateUserProfile = exports.getUserProfile = exports.resetPassword = exports.forgotPassword = exports.startKyc = exports.verifyOtp = exports.sendOtp = exports.getCurrentUser = exports.switchAccount = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Wishlist_1 = __importDefault(require("../models/Wishlist"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
const register = async (req, res) => {
    try {
        const { name, email, password, phone, city, PostalCode } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create new user. Default to active status, and primary address
        const newUser = new User_1.default({
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
        await new Cart_1.default({ user: newUser._id, items: [] }).save();
        await new Wishlist_1.default({ user: newUser._id, products: [] }).save();
        const token = jsonwebtoken_1.default.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (user.status === 'Suspended') {
            return res.status(403).json({ success: false, message: 'Account suspended' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.login = login;
// Switch account between renter (user) and lender (lender)
const switchAccount = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        // Toggle role between 'buyer' and 'seller'
        const newRole = user.role === 'buyer' ? 'seller' : 'buyer';
        user.role = newRole;
        user.is_switched = !user.is_switched;
        await user.save();
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.switchAccount = switchAccount;
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id).select('-password');
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({
            success: true,
            user
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCurrentUser = getCurrentUser;
// Mock OTP verification endpoints
const sendOtp = (req, res) => {
    return res.json({
        success: true,
        message: 'Mock OTP code sent to your email',
        otpExpiresIn: 300
    });
};
exports.sendOtp = sendOtp;
const verifyOtp = async (req, res) => {
    // Mock verification, auto registers/logs in
    const { email, otp, type } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    // Return mock successful verification
    let user = await User_1.default.findOne({ email });
    if (!user) {
        // If signup verify otp, create user
        const mockPassword = await bcryptjs_1.default.hash('password123', 10);
        user = new User_1.default({
            name: email.split('@')[0],
            email,
            password: mockPassword,
            role: 'buyer',
            status: 'Active'
        });
        await user.save();
        await new Cart_1.default({ user: user._id, items: [] }).save();
        await new Wishlist_1.default({ user: user._id, products: [] }).save();
    }
    const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
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
exports.verifyOtp = verifyOtp;
// Mock KYC start
const startKyc = (req, res) => {
    return res.json({
        success: true,
        data: {
            kyc_id: 'kyc_' + Math.random().toString(36).substr(2, 9),
            session_id: 'sess_' + Math.random().toString(36).substr(2, 9),
            session_url: 'https://verify.navyaa-kyc-mock.com/verify'
        }
    });
};
exports.startKyc = startKyc;
// Mock forgot/reset passwords
const forgotPassword = (req, res) => {
    return res.json({
        success: true,
        message: 'Mock reset email sent'
    });
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    return res.json({
        success: true,
        message: 'Password reset successful'
    });
};
exports.resetPassword = resetPassword;
const getUserProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id).select('-password');
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUserProfile = getUserProfile;
const updateUserProfile = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        const { name, phone, bio, address, addresses } = req.body;
        if (name)
            user.name = name;
        if (phone !== undefined)
            user.phone = phone;
        if (bio !== undefined)
            user.bio = bio;
        if (addresses) {
            try {
                user.addresses = typeof addresses === 'string' ? JSON.parse(addresses) : addresses;
            }
            catch (e) {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateUserProfile = updateUserProfile;
const getRenterAddresses = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        return res.json({
            success: true,
            data: {
                addresses: user.addresses || []
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getRenterAddresses = getRenterAddresses;
const addRenterAddress = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        const { label, street_name, house_number, house_number_suffix, city, postal_code, is_primary } = req.body;
        const newAddress = {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.addRenterAddress = addRenterAddress;
const updateRenterAddress = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        const addressId = req.params.id;
        const address = user.addresses.find(addr => addr._id && addr._id.toString() === addressId);
        if (!address)
            return res.status(404).json({ success: false, message: 'Address not found' });
        const { label, street_name, house_number, house_number_suffix, city, postal_code, is_primary } = req.body;
        if (label !== undefined)
            address.label = label;
        if (street_name !== undefined)
            address.street_name = street_name;
        if (house_number !== undefined)
            address.house_number = house_number;
        if (house_number_suffix !== undefined)
            address.house_number_suffix = house_number_suffix;
        if (city !== undefined)
            address.city = city;
        if (postal_code !== undefined)
            address.postal_code = postal_code;
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateRenterAddress = updateRenterAddress;
const deleteRenterAddress = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const user = await User_1.default.findById(req.user.id);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteRenterAddress = deleteRenterAddress;
