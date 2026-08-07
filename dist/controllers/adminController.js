"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getadminPayouts = exports.getadminPayoutStats = exports.bulkModerateWaitlists = exports.moderateWaitlist = exports.getadminWaitlists = exports.createWaitlist = exports.getadminTransactions = exports.bulkUpdateUsers = exports.updateUserStatus = exports.toggleTopLender = exports.getadminUserById = exports.getadminUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const mongoose_1 = __importDefault(require("mongoose"));
// User moderation: GET /api/v1/admin/users
const getadminUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 10 } = req.query;
        const query = {};
        if (role && role !== 'All')
            query.role = String(role).toLowerCase() === 'renter' ? 'user' : String(role).toLowerCase();
        if (status && status !== 'All Status')
            query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: String(search), $options: 'i' } },
                { email: { $regex: String(search), $options: 'i' } }
            ];
        }
        const skipIndex = (Number(page) - 1) * Number(limit);
        const totalItems = await User_1.default.countDocuments(query);
        const users = await User_1.default.find(query)
            .select('-password')
            .skip(skipIndex)
            .limit(Number(limit))
            .sort({ createdAt: -1 });
        const totalPages = Math.ceil(totalItems / Number(limit));
        // Map user schema fields to what frontend usersTable expects:
        // User interface expectations: id, name, email, role, dateJoined, status, bookings, listings
        const mappedUsers = [];
        for (const u of users) {
            const ordersCount = await Order_1.default.countDocuments({ renter: u._id });
            const productsCount = await Product_1.default.countDocuments({ lender: u._id });
            mappedUsers.push({
                id: u._id,
                name: u.name,
                email: u.email,
                role: u.role === 'buyer' ? 'Renter' : u.role === 'seller' ? 'Lender' : 'admin',
                dateJoined: u.createdAt,
                status: u.status,
                lastActive: u.updatedAt,
                bookings: ordersCount,
                listings: productsCount,
                disputes: 0,
                rating: 5,
                is_top_lender: u.is_top_lender,
                avatar: u.profile_image
            });
        }
        return res.json({
            success: true,
            data: {
                users: mappedUsers,
                pagination: {
                    currentPage: Number(page),
                    totalPages,
                    totalItems
                },
                counts: {
                    total: totalItems,
                    roleCounts: { Lender: totalItems, Renter: 0, Both: 0 },
                    statusCounts: { Active: totalItems, Inactive: 0, Suspended: 0 }
                }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getadminUsers = getadminUsers;
// GET /api/v1/admin/user/:userId
const getadminUserById = async (req, res) => {
    try {
        const u = await User_1.default.findById(req.params.userId).select('-password');
        if (!u)
            return res.status(404).json({ success: false, message: 'User not found' });
        const ordersCount = await Order_1.default.countDocuments({ renter: u._id });
        const productsCount = await Product_1.default.countDocuments({ lender: u._id });
        const mapped = {
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role === 'buyer' ? 'Renter' : u.role === 'seller' ? 'Lender' : 'admin',
            dateJoined: u.createdAt,
            status: u.status,
            lastActive: u.updatedAt,
            bookings: ordersCount,
            listings: productsCount,
            disputes: 0,
            rating: 5,
            is_top_lender: u.is_top_lender,
            avatar: u.profile_image,
            phone: u.phone,
            bio: u.bio,
            addresses: u.addresses
        };
        return res.json({ success: true, data: mapped });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getadminUserById = getadminUserById;
// Toggle top lender status POST /api/v1/admin/user/toggle-top-lender/:userId
const toggleTopLender = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.userId);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        user.is_top_lender = !user.is_top_lender;
        await user.save();
        return res.json({
            success: true,
            message: 'Top lender status updated',
            data: { is_top_lender: user.is_top_lender }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleTopLender = toggleTopLender;
// Update user status POST /api/v1/admin/user/:userId/update-status
const updateUserStatus = async (req, res) => {
    try {
        const { action, reason } = req.body;
        const user = await User_1.default.findById(req.params.userId);
        if (!user)
            return res.status(404).json({ success: false, message: 'User not found' });
        user.status = action === 'Suspended' ? 'Suspended' : 'Active';
        await user.save();
        return res.json({
            success: true,
            message: `User status changed to ${user.status}`,
            data: { newStatus: user.status }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateUserStatus = updateUserStatus;
// Bulk action on users POST /api/v1/admin/users/bulk/action
const bulkUpdateUsers = async (req, res) => {
    try {
        const { userIds, action } = req.body;
        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No userIds provided' });
        }
        if (action === 'Activate') {
            await User_1.default.updateMany({ _id: { $in: userIds } }, { status: 'Active' });
        }
        else if (action === 'Suspend') {
            await User_1.default.updateMany({ _id: { $in: userIds } }, { status: 'Suspended' });
        }
        else if (action === 'MakeTopLender') {
            await User_1.default.updateMany({ _id: { $in: userIds } }, { is_top_lender: true });
        }
        else if (action === 'RemoveFromTopLender') {
            await User_1.default.updateMany({ _id: { $in: userIds } }, { is_top_lender: false });
        }
        return res.json({ success: true, message: 'Bulk actions applied successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.bulkUpdateUsers = bulkUpdateUsers;
// admin list transactions GET /api/v1/admin/transactions
const getadminTransactions = async (req, res) => {
    try {
        const orders = await Order_1.default.find()
            .populate('renter', 'name email')
            .populate('lender', 'name email')
            .sort({ createdAt: -1 });
        const transactions = orders.map((o) => ({
            _id: o._id,
            transactionId: o.transaction || 'TXN_' + o._id,
            orderNumber: o.order_number,
            amount: o.total_price,
            currency: 'INR',
            status: 'Completed',
            paymentMethod: 'card',
            createdAt: o.createdAt,
            renter: o.renter,
            lender: o.lender
        }));
        return res.json({
            success: true,
            data: {
                transactions,
                summary: {
                    totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
                    payoutsTotal: 0,
                    chargebacksTotal: 0
                }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getadminTransactions = getadminTransactions;
// Waitlist Model / CRUD inside this file to avoid file clutter
const WaitlistSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true },
    postal_code: { type: String, required: true },
    role: { type: String, enum: ['Renter', 'Lender'], default: 'Renter' },
    brands: [{ type: String }],
    brand_image: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
const Waitlist = mongoose_1.default.models.Waitlist || mongoose_1.default.model('Waitlist', WaitlistSchema);
// CREATE Waitlist POST /api/v1/create-waitlist
const createWaitlist = async (req, res) => {
    try {
        const { name, email, city, postal_code, role, brands } = req.body;
        const item = new Waitlist({
            name,
            email,
            city,
            postal_code,
            role: role || 'Renter',
            brands: brands ? String(brands).split(',') : [],
            status: 'Pending'
        });
        await item.save();
        return res.status(201).json({ success: true, message: 'Signed up to waitlist', data: item });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createWaitlist = createWaitlist;
// GET Waitlist (admin) GET /api/v1/admin/waitlists
const getadminWaitlists = async (req, res) => {
    try {
        const { status, search, page = 1 } = req.query;
        const query = {};
        if (status && status !== 'All')
            query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: String(search), $options: 'i' } },
                { email: { $regex: String(search), $options: 'i' } }
            ];
        }
        const items = await Waitlist.find(query).sort({ created_at: -1 });
        return res.json({
            success: true,
            data: {
                waitlists: items,
                pagination: { currentPage: Number(page), totalPages: 1, totalItems: items.length },
                statusSummary: {
                    pending: items.filter(i => i.status === 'Pending').length,
                    approved: items.filter(i => i.status === 'Approved').length,
                    rejected: items.filter(i => i.status === 'Rejected').length,
                    total: items.length
                }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getadminWaitlists = getadminWaitlists;
// Moderate single waitlist record POST /api/v1/admin/waitlists/:id
const moderateWaitlist = async (req, res) => {
    try {
        const { status } = req.body;
        const item = await Waitlist.findByIdAndUpdate(req.params.id, { status }, { new: true });
        return res.json({ success: true, data: item });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.moderateWaitlist = moderateWaitlist;
// Bulk moderate waitlists POST /api/v1/admin/waitlists/bulk/action
const bulkModerateWaitlists = async (req, res) => {
    try {
        const { waitlistIds, action } = req.body;
        const status = action === 'Approve' ? 'Approved' : 'Rejected';
        await Waitlist.updateMany({ _id: { $in: waitlistIds } }, { status });
        return res.json({ success: true, message: 'Waitlists bulk updated' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.bulkModerateWaitlists = bulkModerateWaitlists;
// Payouts Stats (admin) GET /api/v1/admin/payouts/stats/dashboard
const getadminPayoutStats = async (req, res) => {
    return res.json({
        success: true,
        data: {
            stats: {
                totalPayoutsVolume: 15000,
                pendingPayoutsVolume: 1200,
                completedPayoutsCount: 140,
                failedPayoutsCount: 2
            }
        }
    });
};
exports.getadminPayoutStats = getadminPayoutStats;
// Payouts list (admin) GET /api/v1/admin/payouts
const getadminPayouts = async (req, res) => {
    try {
        const orders = await Order_1.default.find({ payout_status: 'Pending' })
            .populate('lender', 'name email')
            .sort({ createdAt: -1 });
        const payouts = orders.map(o => ({
            _id: o._id,
            payoutId: 'PAY_' + o._id.toString().slice(-6).toUpperCase(),
            seller: o.lender,
            amount: o.earnings,
            currency: 'INR',
            status: o.payout_status,
            dateCreated: o.createdAt
        }));
        return res.json({
            success: true,
            data: {
                payouts,
                pagination: { currentPage: 1, totalPages: 1, totalItems: payouts.length }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getadminPayouts = getadminPayouts;
