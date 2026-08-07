"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ProductSchema = new mongoose_1.Schema({
    _id: { type: String, required: true },
    lender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    occasion: { type: String, default: 'Casual' },
    size: [{ type: String }],
    price: { type: Number, required: true },
    rental_price_per_day: { type: Number },
    cleaning_fee: { type: Number, default: 0 },
    security_deposit: { type: Number, default: 0 },
    blocked_dates: [
        {
            start_date: { type: String },
            end_date: { type: String }
        }
    ],
    images: [{ type: String }],
    cover_image: { type: String, default: "" },
    quantity: { type: Number, default: 10 },
    status: { type: String, enum: ['Draft', 'Pending', 'Active', 'Inactive'], default: 'Active' },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    sub_category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' },
    rating: { type: Number, default: 5 },
    rating_count: { type: Number, default: 1 },
    terms_and_condition: { type: Boolean, default: true },
    is_featured: { type: Boolean, default: false },
    wishlisted_by: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});
// Sync rental_price_per_day with price automatically on save
ProductSchema.pre('save', function (next) {
    if (this.price !== undefined) {
        this.rental_price_per_day = this.price;
    }
    next();
});
exports.default = mongoose_1.default.model('Product', ProductSchema);
