"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
// Route imports
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const wishlistRoutes_1 = __importDefault(require("./routes/wishlistRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded images statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/v1/Productimages', express_1.default.static(path_1.default.join(__dirname, '../Productimages')));
// API Routes Prefix `/api/v1`
const apiPrefix = '/api/v1';
app.use(apiPrefix, authRoutes_1.default);
app.use(apiPrefix, productRoutes_1.default);
app.use(apiPrefix, cartRoutes_1.default);
app.use(apiPrefix, orderRoutes_1.default);
app.use(apiPrefix, reviewRoutes_1.default);
app.use(apiPrefix, wishlistRoutes_1.default);
app.use(apiPrefix, adminRoutes_1.default);
app.use(apiPrefix, dashboardRoutes_1.default);
app.use(apiPrefix, settingsRoutes_1.default);
app.use(apiPrefix, categoryRoutes_1.default);
app.use(apiPrefix, aiRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        errors: err.errors || null
    });
});
exports.default = app;
