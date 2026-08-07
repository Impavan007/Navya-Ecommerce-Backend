import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderProduct {
  product: string;
  lender: mongoose.Types.ObjectId;
  quantity: number;
  size: string;
  start_date: string;
  end_date: string;
  duration: number;
  rental_price_per_day: number;
  cleaning_fee: number;
  security_deposit: number;
  subtotal: number;
}

export interface ITimelineEvent {
  title: string;
  by: string;
  note: string;
  date: string;
}

export interface IOrder extends Document {
  order_number: string;
  order_slug_id: string; // duplicate/alias for slug
  renter: mongoose.Types.ObjectId; // customer
  lender: mongoose.Types.ObjectId; // seller
  products: IOrderProduct[];
  rental_fee_total: number; // total item cost
  cleaning_fee_total: number;
  security_deposit_total: number;
  platform_fee: number;
  earnings: number; // seller earnings
  shipping_charge: number;
  late_fee: number;
  total_price: number;
  status: 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Returned' | 'Completed' | 'Cancelled';
  timeline: ITimelineEvent[];
  address: string; // JSON string of address or text
  payout_status: 'Pending' | 'Paid' | 'Processing';
  payout_amount: number;
  transaction: string; // Mock Stripe payment intent or reference
  createdAt: Date;
  updatedAt: Date;
}

const OrderProductSchema = new Schema<IOrderProduct>({
  product: { type: String, ref: 'Product', required: true },
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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

const TimelineEventSchema = new Schema<ITimelineEvent>({
  title: { type: String, required: true },
  by: { type: String, required: true },
  note: { type: String, default: '' },
  date: { type: String, required: true }
});

const OrderSchema = new Schema<IOrder>({
  order_number: { type: String, required: true, unique: true },
  order_slug_id: { type: String, required: true, unique: true },
  renter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
    enum: ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Returned', 'Completed', 'Cancelled'],
    default: 'Placed'
  },
  timeline: [TimelineEventSchema],
  address: { type: String, required: true },
  payout_status: { type: String, enum: ['Pending', 'Paid', 'Processing'], default: 'Pending' },
  payout_amount: { type: Number, default: 0 },
  transaction: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.model<IOrder>('Order', OrderSchema);
