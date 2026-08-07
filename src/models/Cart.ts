import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
  _id?: any;
  product: string;
  size: string;
  quantity: number;
  start_date: string; // compatibility field
  end_date: string;   // compatibility field
  duration: number;   // compatibility field
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  product: { type: String, ref: 'Product', required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  start_date: { type: String, default: '' },
  end_date: { type: String, default: '' },
  duration: { type: Number, default: 1 }
});

const CartSchema = new Schema<ICart>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [CartItemSchema]
}, {
  timestamps: true
});

export default mongoose.model<ICart>('Cart', CartSchema);
