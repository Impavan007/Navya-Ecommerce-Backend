import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
  _id?: any;
  label: string;
  street_name: string;
  house_number: string;
  house_number_suffix?: string;
  city: string;
  state?: string;
  postal_code: string;
  is_primary: boolean;
  created_at?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  profile_image?: string;
  bio?: string;
  role: 'buyer' | 'seller' | 'admin';
  status: 'Active' | 'Suspended' | 'Inactive';
  addresses: IAddress[];
  is_top_lender?: boolean;
  switch_account?: boolean;
  is_switched?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  label: { type: String, required: true },
  street_name: { type: String, required: true },
  house_number: { type: String, required: true },
  house_number_suffix: { type: String },
  city: { type: String, required: true },
  state: { type: String },
  postal_code: { type: String, required: true },
  is_primary: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const UserSchema = new Schema<IUser>({
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

export default mongoose.model<IUser>('User', UserSchema);
