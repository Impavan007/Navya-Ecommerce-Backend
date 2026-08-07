import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  user: mongoose.Types.ObjectId;
  products: string[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistSchema = new Schema<IWishlist>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{ type: String, ref: 'Product' }]
}, {
  timestamps: true
});

export default mongoose.model<IWishlist>('Wishlist', WishlistSchema);
