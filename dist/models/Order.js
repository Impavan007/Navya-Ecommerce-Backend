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
const OrderProductSchema = new mongoose_1.Schema({
    product: { type: String, ref: 'Product', required: true },
    lender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true },
    size: { type: String, required: true },
    start_date: { type: String, default: '' },
    end_date: { type: String, default: '' },
    duration: { type: Number, default: 1 },
    rental_price_per_day: { type: Number, required: true },
    cleaning_fee: { type: Number, default: 0 },
    security_deposit: { type: Number, default: 0 },
    subtotal: { type: Number, required: true }
});
const TimelineEventSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    by: { type: String, required: true },
    note: { type: String, default: '' },
    date: { type: String, required: true }
});
const OrderSchema = new mongoose_1.Schema({
    order_number: { type: String, required: true, unique: true },
    order_slug_id: { type: String, required: true, unique: true },
    renter: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    lender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [OrderProductSchema],
    rental_fee_total: { type: Number, required: true },
    cleaning_fee_total: { type: Number, default: 0 },
    security_deposit_total: { type: Number, default: 0 },
    platform_fee: { type: Number, default: 0 },
    earnings: { type: Number, required: true },
    shipping_charge: { type: Number, default: 0 },
    late_fee: { type: Number, default: 0 },
    total_price: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Returned', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    timeline: [TimelineEventSchema],
    address: { type: String, required: true },
    payout_status: { type: String, enum: ['Pending', 'Paid', 'Processing'], default: 'Pending' },
    payout_amount: { type: Number, default: 0 },
    transaction: { type: String, required: true }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Order', OrderSchema);
