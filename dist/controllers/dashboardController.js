"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getadminDashboard = exports.getLenderTransactions = exports.getLenderEarningsOverview = exports.getLenderDashboard = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
// seller Dashboard stats: GET /api/v1/lender/dashboard
const getLenderDashboard = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const sellerId = new mongoose_1.default.Types.ObjectId(req.user.id);
        // Active listings count
        const activeListingsCount = await Product_1.default.countDocuments({ lender: sellerId, status: 'Active' });
        // Orders for this lender
        const lenderOrders = await Order_1.default.find({ lender: sellerId }).sort({ createdAt: -1 });
        const upcomingOrdersList = lenderOrders.slice(0, 5).map(o => ({
            orderId: o._id,
            status: o.status,
            productName: o.products[0]?.product ? 'Product Item' : 'N/A',
            renterName: 'Renter',
            dates: { start: o.products[0]?.start_date || '', end: o.products[0]?.end_date || '' },
            amount: `Rs.${o.total_price}`
        }));
        // Calculate total earnings
        let totalEarnings = 0;
        let pendingReturnsCount = 0;
        let upcomingRentalsCount = 0;
        lenderOrders.forEach(o => {
            totalEarnings += o.earnings;
            if (o.status === 'Shipped' || o.status === 'Delivered') {
                pendingReturnsCount++;
            }
            if (o.status === 'Pending' || o.status === 'Confirmed') {
                upcomingRentalsCount++;
            }
        });
        const data = {
            summaryCards: {
                activeListings: { count: activeListingsCount, label: 'Active Listings', subtitle: 'Products online', trend: '+2% this week' },
                upcomingRentals: { count: upcomingRentalsCount, label: 'Upcoming Orders', subtitle: 'Orders awaiting shipping', trend: 'Stable' },
                pendingReturns: { count: pendingReturnsCount, label: 'Active Shipments', subtitle: 'Orders in transit', trend: '-1%' },
                totalEarnings: { amount: totalEarnings, currency: 'INR', label: 'Total Earnings', subtitle: 'After platform fees', trend: '+12% this month' }
            },
            notifications: {
                title: 'Updates',
                tabs: ['All', 'Orders', 'Listings'],
                activities: [
                    { id: '1', type: 'order', title: 'New order received', description: 'Order placed for one of your items.', time: '10 mins ago', actionText: 'View Order' }
                ]
            },
            upcomingOrders: {
                title: 'Recent Orders',
                viewAllText: 'View All Orders',
                orders: upcomingOrdersList
            },
            earningsSnapshot: {
                currentPeriod: { amount: totalEarnings, currency: 'INR', label: 'Earnings', trend: '+5%' },
                previousPeriod: { amount: totalEarnings * 0.9, currency: 'INR', label: 'Prev Earnings' },
                chartData: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    data: [100, 200, totalEarnings, totalEarnings, totalEarnings, totalEarnings]
                }
            }
        };
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLenderDashboard = getLenderDashboard;
// seller Earnings overview: GET /api/v1/lender/earnings/overview
const getLenderEarningsOverview = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const sellerId = new mongoose_1.default.Types.ObjectId(req.user.id);
        const lenderOrders = await Order_1.default.find({ lender: sellerId });
        let netEarnings = 0;
        let pendingPayout = 0;
        lenderOrders.forEach(o => {
            netEarnings += o.earnings;
            if (o.payout_status === 'Pending') {
                pendingPayout += o.earnings;
            }
        });
        return res.json({
            success: true,
            data: {
                netEarnings,
                pendingPayout,
                availableForPayout: netEarnings - pendingPayout,
                analytics: {
                    totalSales: lenderOrders.length,
                    averageOrderValue: lenderOrders.length > 0 ? netEarnings / lenderOrders.length : 0
                }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLenderEarningsOverview = getLenderEarningsOverview;
// seller Earnings transactions: GET /api/v1/lender/earnings/transactions
const getLenderTransactions = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const sellerId = new mongoose_1.default.Types.ObjectId(req.user.id);
        const orders = await Order_1.default.find({ lender: sellerId })
            .populate('renter', 'name')
            .sort({ createdAt: -1 });
        const transactions = orders.map(o => ({
            id: o._id,
            transactionId: o.transaction,
            type: 'Sale',
            amount: o.earnings,
            status: o.payout_status,
            date: o.createdAt,
            description: `Order ${o.order_number} by ${o.renter?.name || 'Customer'}`
        }));
        return res.json({
            success: true,
            data: {
                transactionHistory: {
                    transactions
                },
                filters: {
                    types: ['All Types', 'Sale', 'Payout'],
                    statuses: ['All Status', 'Pending', 'Paid'],
                    currentType: 'All Types',
                    currentStatus: 'All Status'
                },
                pagination: { currentPage: 1, totalPages: 1, totalItems: transactions.length },
                cards: {
                    totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
                    netSales: transactions.reduce((sum, t) => sum + t.amount, 0),
                    totalPayouts: 0
                }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLenderTransactions = getLenderTransactions;
// admin Dashboard stats: GET /api/v1/admin/dashboard
const getadminDashboard = async (req, res) => {
    try {
        const totalActiveUsers = await User_1.default.countDocuments({ role: 'user', status: 'Active' });
        const totalsellers = await User_1.default.countDocuments({ role: 'lender', status: 'Active' });
        const totalBookings = await Order_1.default.countDocuments();
        const pendingListings = await Product_1.default.countDocuments({ status: 'Pending' });
        // Calculate total GMV
        const orders = await Order_1.default.find();
        const gmv = orders.reduce((sum, o) => sum + o.total_price, 0);
        const recentBookingsList = orders.slice(0, 5).map(o => ({
            id: o._id,
            bookingId: o.order_number,
            status: o.status,
            productName: 'Product',
            renterName: 'Renter',
            lenderName: 'Lender',
            amount: `Rs.${o.total_price}`,
            timeAgo: 'Just now',
            created_at: o.createdAt.toISOString()
        }));
        const data = {
            periodFilter: { current: '30d', options: ['7d', '30d', '90d', '1y'], label: 'Last 30 Days' },
            summaryCards: {
                totalActiveUsers: { count: totalActiveUsers + totalsellers, label: 'Active Users', subtitle: 'Active accounts', trend: '+5%', trendDirection: 'up' },
                totalBookings: { count: totalBookings, label: 'Total Orders', subtitle: 'Orders placed', trend: '+12%', trendDirection: 'up' },
                gmv: { amount: gmv, currency: 'INR', label: 'GMV', subtitle: 'Total volume sold', trend: '+15%', trendDirection: 'up' },
                pendingListings: { count: pendingListings, label: 'Pending Moderation', subtitle: 'Products awaiting review', trend: '-2%', trendDirection: 'down' },
                openDisputes: { count: 0, label: 'Open Disputes', subtitle: 'Requires moderation', trend: '0%', trendDirection: 'neutral' }
            },
            recentActivity: {
                title: 'Platform Activity',
                subtitle: 'Real-time overview',
                latestBookings: {
                    title: 'Recent Orders',
                    bookings: recentBookingsList
                },
                latestDisputes: {
                    title: 'Recent Disputes',
                    disputes: []
                }
            }
        };
        return res.json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getadminDashboard = getadminDashboard;
