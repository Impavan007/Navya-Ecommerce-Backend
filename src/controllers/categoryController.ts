import { Request, Response } from 'express';
import Category from '../models/Category';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ parent: null }).populate('sub_categories');
    return res.json({ success: true, data: categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const subCategories = await Category.find({ parent: categoryId });
    return res.json({ success: true, data: subCategories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, image, parentId } = req.body;
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = new Category({
      name,
      slug,
      description,
      image,
      parent: parentId || null
    });

    await category.save();

    if (parentId) {
      await Category.findByIdAndUpdate(parentId, {
        $push: { sub_categories: category._id }
      });
    }

    return res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
