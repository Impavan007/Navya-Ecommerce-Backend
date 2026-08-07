import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  reviewer: mongoose.Types.ObjectId;
  product: string;
  lender: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: String, ref: 'Product', required: true },
  lender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IReview>('Review', ReviewSchema);
