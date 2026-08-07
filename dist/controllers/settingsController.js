"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const Settings_1 = __importDefault(require("../models/Settings"));
const getSettings = async (req, res) => {
    try {
        let settings = await Settings_1.default.findOne();
        if (!settings) {
            settings = new Settings_1.default();
            await settings.save();
        }
        return res.json({ success: true, data: settings });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        let settings = await Settings_1.default.findOne();
        if (!settings) {
            settings = new Settings_1.default();
        }
        const { title, description, email, website_url, logo, favicon, social_links, meta_title, notification_banner } = req.body;
        if (title)
            settings.title = title;
        if (description)
            settings.description = description;
        if (email)
            settings.email = email;
        if (website_url)
            settings.website_url = website_url;
        if (logo)
            settings.logo = logo;
        if (favicon)
            settings.favicon = favicon;
        if (social_links)
            settings.social_links = social_links;
        if (meta_title)
            settings.meta_title = meta_title;
        if (notification_banner !== undefined)
            settings.notification_banner = notification_banner;
        await settings.save();
        return res.json({ success: true, message: 'Settings updated successfully', data: settings });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateSettings = updateSettings;
