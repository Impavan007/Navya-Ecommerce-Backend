import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status: 'Active' | 'Inactive';
  parent?: mongoose.Types.ObjectId;
  sub_categories: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  sub_categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }]
}, {
  timestamps: true
});

export default mongoose.model<ICategory>('Category', CategorySchema);
