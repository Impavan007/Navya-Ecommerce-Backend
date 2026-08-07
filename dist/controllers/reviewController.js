"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLenderReviews = exports.renterCreateReview = exports.getProductReviews = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
// Public GET reviews of a product /api/v1/product/:id/reviews
const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review_1.default.find({ product: req.params.id })
            .populate('reviewer', 'name profile_image')
            .sort({ createdAt: -1 });
        return res.json({
            success: true,
            data: {
                reviews,
                total: reviews.length
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProductReviews = getProductReviews;
// Customer leaves review POST /api/v1/renter/create-review
const renterCreateReview = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { order, product, lender, rating, review } = req.body;
        const newReview = new Review_1.default({
            reviewer: req.user.id,
            product,
            lender,
            order,
            rating: Number(rating),
            review,
            helpful: 0,
            notHelpful: 0
        });
        await newReview.save();
        // Recalculate average rating of product
        const productReviews = await Review_1.default.find({ product });
        const totalRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const average = totalRating / productReviews.length;
        await Product_1.default.findByIdAndUpdate(product, {
            rating: average,
            rating_count: productReviews.length
        });
        // Mark order item as reviewed
        await Order_1.default.findByIdAndUpdate(order, { reviewAvailable: false });
        return res.status(201).json({ success: true, message: 'Review submitted successfully', data: newReview });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.renterCreateReview = renterCreateReview;
// seller GET reviews of their items /api/v1/lender/reviews
const getLenderReviews = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const reviews = await Review_1.default.find({ lender: req.user.id })
            .populate('reviewer', 'name profile_image')
            .populate('product', 'name cover_image')
            .sort({ createdAt: -1 });
        const formattedReviews = reviews.map(r => {
            const prod = r.product;
            return {
                id: r._id,
                productId: prod?._id,
                borrowerName: r.reviewer ? r.reviewer.name : 'Anonymous Renter',
                borrowerAvatar: r.reviewer ? r.reviewer.profile_image : null,
                itemName: prod?.name || 'Item Name',
                itemImage: prod?.cover_image || null,
                rating: r.rating,
                reviewText: r.review,
                status: 'published',
                datePosted: r.createdAt
            };
        });
        return res.json({
            success: true,
            data: {
                reviews: formattedReviews,
                total: formattedReviews.length
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLenderReviews = getLenderReviews;
