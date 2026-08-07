"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = exports.getSubCategories = exports.getCategories = void 0;
const Category_1 = __importDefault(require("../models/Category"));
const getCategories = async (req, res) => {
    try {
        const categories = await Category_1.default.find({ parent: null }).populate('sub_categories');
        return res.json({ success: true, data: categories });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCategories = getCategories;
const getSubCategories = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const subCategories = await Category_1.default.find({ parent: categoryId });
        return res.json({ success: true, data: subCategories });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSubCategories = getSubCategories;
const createCategory = async (req, res) => {
    try {
        const { name, description, image, parentId } = req.body;
        const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const category = new Category_1.default({
            name,
            slug,
            description,
            image,
            parent: parentId || null
        });
        await category.save();
        if (parentId) {
            await Category_1.default.findByIdAndUpdate(parentId, {
                $push: { sub_categories: category._id }
            });
        }
        return res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCategory = createCategory;
