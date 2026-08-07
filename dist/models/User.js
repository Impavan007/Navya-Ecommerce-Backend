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
const AddressSchema = new mongoose_1.Schema({
    label: { type: String, required: true },
    street_name: { type: String, required: true },
    house_number: { type: String, required: true },
    house_number_suffix: { type: String },
    city: { type: String, required: true },
    postal_code: { type: String, required: true },
    is_primary: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    phone: { type: String },
    profile_image: { type: String, default: null },
    bio: { type: String, default: null },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
    status: { type: String, enum: ['Active', 'Suspended', 'Inactive'], default: 'Active' },
    addresses: [AddressSchema],
    is_top_lender: { type: Boolean, default: false },
    switch_account: { type: Boolean, default: true },
    is_switched: { type: Boolean, default: false }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('User', UserSchema);
