import { Request, Response } from 'express';
import Settings from '../models/Settings';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    return res.json({ success: true, data: settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const { title, description, email, website_url, logo, favicon, social_links, meta_title, notification_banner } = req.body;

    if (title) settings.title = title;
    if (description) settings.description = description;
    if (email) settings.email = email;
    if (website_url) settings.website_url = website_url;
    if (logo) settings.logo = logo;
    if (favicon) settings.favicon = favicon;
    if (social_links) settings.social_links = social_links;
    if (meta_title) settings.meta_title = meta_title;
    if (notification_banner !== undefined) settings.notification_banner = notification_banner;

    await settings.save();
    return res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
