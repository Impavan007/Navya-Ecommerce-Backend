import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockedDate {
  start_date: string;
  end_date: string;
}

export interface IProduct extends Document<string> {
  lender: mongoose.Types.ObjectId;
  name: string;
  description: string;
  brand: string;
  fabric?: string;
  size: string[];
  price: number; // e-commerce purchase price
  rental_price_per_day: number; // compatible alias
  cleaning_fee: number; // set to 0 for ecommerce
  security_deposit: number; // set to 0 for ecommerce
  blocked_dates: IBlockedDate[]; // empty array for compatibility
  images: string[];
  cover_image: string;
  quantity: number; // inventory stock
  status: 'Draft' | 'Pending' | 'Active' | 'Inactive';
  category: mongoose.Types.ObjectId;
  sub_category?: mongoose.Types.ObjectId;
  rating: number;
  rating_count: number;
  terms_and_condition: boolean;
  is_featured: boolean;
  wishlisted_by?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  _id: { type: String, required: true },
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  brand: { type: String, required: true },
  fabric: { type: String, default: 'Cotton' },
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
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  sub_category: { type: Schema.Types.ObjectId, ref: 'Category' },
  rating: { type: Number, default: 5 },
  rating_count: { type: Number, default: 1 },
  terms_and_condition: { type: Boolean, default: true },
  is_featured: { type: Boolean, default: false },
  wishlisted_by: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

// Sync rental_price_per_day with price automatically on save
ProductSchema.pre<IProduct>('save', function (next) {
  if (this.price !== undefined) {
    this.rental_price_per_day = this.price;
  }
  next();
});

export default mongoose.model<IProduct>('Product', ProductSchema);
