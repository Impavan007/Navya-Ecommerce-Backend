"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCheckout = exports.getCartCount = exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const mongoose_1 = __importDefault(require("mongoose"));
const getCart = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        let cart = await Cart_1.default.findOne({ user: req.user.id }).populate('items.product');
        if (!cart) {
            cart = new Cart_1.default({ user: req.user.id, items: [] });
            await cart.save();
        }
        // Clean up items if product was deleted
        const validItems = cart.items.filter(item => item.product !== null);
        if (validItems.length !== cart.items.length) {
            cart.items = validItems;
            await cart.save();
        }
        // Calculate total amount
        let total = 0;
        const formattedItems = cart.items.map(item => {
            const prod = item.product;
            const subtotal = prod.price * item.quantity;
            total += subtotal;
            return {
                _id: item._id,
                size: item.size,
                start_date: item.start_date || '2026-08-01',
                end_date: item.end_date || '2026-08-05',
                quantity: item.quantity,
                duration: item.duration || 4,
                subtotal,
                product: {
                    _id: prod._id,
                    lender: prod.lender,
                    name: prod.name,
                    brand: prod.brand,
                    price: prod.price,
                    rental_price_per_day: prod.price,
                    cleaning_fee: 0,
                    security_deposit: 0,
                    images: prod.images,
                    cover_image: prod.cover_image,
                    quantity: prod.quantity,
                    status: prod.status,
                    category: prod.category,
                    sub_category: prod.sub_category
                },
                pricing: {
                    basePricePerDay: prod.price,
                    discountedPricePerDay: prod.price,
                    discountPercentage: 0,
                    rentalAmount: subtotal,
                    serviceFee: 0,
                    cleaningFee: 0,
                    securityDeposit: 0,
                    subtotal
                }
            };
        });
        return res.json({
            success: true,
            data: {
                cart: formattedItems,
                total
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCart = getCart;
const addToCart = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { productId, size, quantity = 1, startDate = '', endDate = '' } = req.body;
        let product = await Product_1.default.findOne({ _id: productId });
        if (!product && mongoose_1.default.Types.ObjectId.isValid(productId)) {
            product = await Product_1.default.findById(productId);
        }
        if (!product)
            return res.status(404).json({ success: false, message: 'Product not found' });
        let cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart_1.default({ user: req.user.id, items: [] });
        }
        // Check if item already exists with same size
        const existingIndex = cart.items.findIndex(item => item.product.toString() === productId && item.size === size);
        if (existingIndex > -1) {
            cart.items[existingIndex].quantity += Number(quantity);
            if (startDate)
                cart.items[existingIndex].start_date = startDate;
            if (endDate)
                cart.items[existingIndex].end_date = endDate;
        }
        else {
            cart.items.push({
                product: productId,
                size,
                quantity: Number(quantity),
                start_date: startDate || '',
                end_date: endDate || '',
                duration: 1
            });
        }
        await cart.save();
        return res.json({ success: true, message: 'Item added to cart', data: cart });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.addToCart = addToCart;
const updateCartItem = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const { quantity, size } = req.body;
        const cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart)
            return res.status(404).json({ success: false, message: 'Cart not found' });
        const itemIndex = cart.items.findIndex(item => item._id.toString() === req.params.id);
        if (itemIndex === -1)
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        if (quantity !== undefined)
            cart.items[itemIndex].quantity = Number(quantity);
        if (size !== undefined)
            cart.items[itemIndex].size = size;
        await cart.save();
        return res.json({ success: true, message: 'Cart updated', data: cart });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCartItem = updateCartItem;
const removeFromCart = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const cart = await Cart_1.default.findOne({ user: req.user.id });
        if (!cart)
            return res.status(404).json({ success: false, message: 'Cart not found' });
        // Filter out item by matching product._id or item._id
        cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId && item._id.toString() !== req.params.productId);
        await cart.save();
        return res.json({ success: true, message: 'Item removed from cart' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.removeFromCart = removeFromCart;
const clearCart = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const cart = await Cart_1.default.findOne({ user: req.user.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        return res.json({ success: true, message: 'Cart cleared' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.clearCart = clearCart;
const getCartCount = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const cart = await Cart_1.default.findOne({ user: req.user.id });
        const count = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        return res.json({ success: true, data: { count } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCartCount = getCartCount;
// Mock checkout calculation: POST /api/v1/renter/checkout/calculate
const calculateCheckout = async (req, res) => {
    try {
        const { products, promo_code } = req.body;
        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: 'No items to calculate' });
        }
        let rentalAmount = 0;
        const calcProducts = [];
        for (const item of products) {
            const prod = await Product_1.default.findById(item.product);
            if (!prod)
                continue;
            const subtotal = prod.price * item.quantity;
            rentalAmount += subtotal;
            calcProducts.push({
                productId: prod._id,
                productName: prod.name,
                quantity: item.quantity,
                size: item.size,
                duration: 1,
                dates: { start: item.start_date || '', end: item.end_date || '' },
                pricing: {
                    basePricePerDay: prod.price,
                    discountedPricePerDay: prod.price,
                    discountPercentage: 0,
                    rentalAmount: subtotal,
                    cleaningFee: 0,
                    securityDeposit: 0,
                    promoDiscount: 0
                }
            });
        }
        const serviceCharge = rentalAmount * 0.05; // 5% platform fee
        let promoDiscount = 0;
        if (promo_code === 'WELCOME10') {
            promoDiscount = rentalAmount * 0.1; // 10% discount
        }
        const totalAmount = rentalAmount + serviceCharge - promoDiscount;
        return res.json({
            success: true,
            data: {
                products: calcProducts,
                pricingBreakdown: {
                    price: rentalAmount,
                    rentalAmount,
                    cleaningFee: 0,
                    securityDeposit: 0,
                    serviceCharge,
                    serviceChargePercentage: 5,
                    promoCode: promo_code || null,
                    totalAmount
                },
                paymentIntent: {
                    clientSecret: 'mock_client_secret_' + Math.random().toString(36).substr(2, 9),
                    setupIntentId: 'mock_setup_intent',
                    customerId: 'mock_customer',
                    publishableKey: 'pk_test_mock'
                }
            }
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.calculateCheckout = calculateCheckout;
