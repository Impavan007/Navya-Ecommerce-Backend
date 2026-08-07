import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialLinks {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
}

export interface IMetaTitle {
  title?: string;
  description?: string;
  keyword?: string;
}

export interface ISettings extends Document {
  title: string;
  description: string;
  email: string;
  website_url: string;
  logo: string;
  favicon: string;
  social_links: ISocialLinks;
  meta_title: IMetaTitle;
  notification_banner?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinksSchema = new Schema<ISocialLinks>({
  facebook: { type: String, default: '' },
  instagram: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  twitter: { type: String, default: '' },
  tiktok: { type: String, default: '' }
}, { _id: false });

const MetaTitleSchema = new Schema<IMetaTitle>({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  keyword: { type: String, default: '' }
}, { _id: false });

const SettingsSchema = new Schema<ISettings>({
  title: { type: String, default: 'Navyaa E-Commerce' },
  description: { type: String, default: 'E-commerce fashion marketplace' },
  email: { type: String, default: 'support@navyaa.com' },
  website_url: { type: String, default: 'https://navyaa.com' },
  logo: { type: String, default: '/logo.png' },
  favicon: { type: String, default: '/favicon.ico' },
  social_links: { type: SocialLinksSchema, default: {} },
  meta_title: { type: MetaTitleSchema, default: {} },
  notification_banner: { type: String, default: '' }
}, {
  timestamps: true
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
