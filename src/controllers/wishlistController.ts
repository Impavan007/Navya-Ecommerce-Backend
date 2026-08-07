import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Wishlist from '../models/Wishlist';
import Product from '../models/Product';

export const getWishlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
      await wishlist.save();
    }

    // Wrap in standard response structure
    return res.json({
      success: true,
      data: {
        wishlists: [
          {
            _id: wishlist._id,
            user: wishlist.user,
            products: wishlist.products.map((p: any) => ({
              _id: p._id,
              name: p.name,
              brand: p.brand,
              price: p.price,
              rental_price_per_day: p.rental_price_per_day,
              cover_image: p.cover_image,
              images: p.images,
              size: p.size,
              color: p.color || '',
              description: p.description
            }))
          }
        ]
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { productId, product_id } = req.body;
    const targetProductId = productId || product_id;

    if (!targetProductId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
    }

    const index = wishlist.products.indexOf(targetProductId);
    let message = '';
    if (index > -1) {
      // Toggle off: remove
      wishlist.products.splice(index, 1);
      message = 'Removed from wishlist';
      await Product.findByIdAndUpdate(targetProductId, { $pull: { wishlisted_by: req.user.id } });
    } else {
      // Toggle on: add
      wishlist.products.push(targetProductId);
      message = 'Added to wishlist';
      await Product.findByIdAndUpdate(targetProductId, { $addToSet: { wishlisted_by: req.user.id } });
    }
    await wishlist.save();

    const populated = await Wishlist.findById(wishlist._id).populate('products');

    return res.json({
      success: true,
      message,
      data: {
        products: populated ? populated.products : []
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
      await wishlist.save();
    }

    // Pull from Product model
    await Product.findByIdAndUpdate(productId, { $pull: { wishlisted_by: req.user.id } });

    return res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWishlist = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { products } = req.body; // Array of product IDs
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    const oldProducts = wishlist ? wishlist.products : [];

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
    }

    wishlist.products = products;
    await wishlist.save();

    // Sync product model wishlisted_by field
    const added = products.filter((id: string) => !oldProducts.includes(id));
    const removed = oldProducts.filter((id: string) => !products.includes(id));

    if (added.length) {
      await Product.updateMany({ _id: { $in: added } }, { $addToSet: { wishlisted_by: req.user.id } });
    }
    if (removed.length) {
      await Product.updateMany({ _id: { $in: removed } }, { $pull: { wishlisted_by: req.user.id } });
    }

    const populated = await Wishlist.findById(wishlist._id).populate('products');

    return res.json({
      success: true,
      message: 'Wishlist updated',
      data: {
        products: populated?.products || []
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
