import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';

// Public GET reviews of a product /api/v1/product/:id/reviews
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ product: req.params.id })
      .populate('reviewer', 'name profile_image')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        reviews,
        total: reviews.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Customer leaves review POST /api/v1/renter/create-review
export const renterCreateReview = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { order, product, lender, rating, review } = req.body;

    const newReview = new Review({
      reviewer: req.user.id,
      product,
      lender,
      order,
      rating: Number(rating),
      review,
      helpful: 0,
      notHelpful: 0
    });

    await newReview.save();

    // Recalculate average rating of product
    const productReviews = await Review.find({ product });
    const totalRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const average = totalRating / productReviews.length;

    await Product.findByIdAndUpdate(product, {
      rating: average,
      rating_count: productReviews.length
    });

    // Mark order item as reviewed
    await Order.findByIdAndUpdate(order, { reviewAvailable: false });

    return res.status(201).json({ success: true, message: 'Review submitted successfully', data: newReview });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// seller GET reviews of their items /api/v1/lender/reviews
export const getLenderReviews = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const reviews = await Review.find({ lender: req.user.id })
      .populate('reviewer', 'name profile_image')
      .populate('product', 'name cover_image')
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map(r => {
      const prod = r.product as any;
      return {
        id: r._id,
        productId: prod?._id,
        borrowerName: r.reviewer ? (r.reviewer as any).name : 'Anonymous Renter',
        borrowerAvatar: r.reviewer ? (r.reviewer as any).profile_image : null,
        itemName: prod?.name || 'Item Name',
        itemImage: prod?.cover_image || null,
        rating: r.rating,
        reviewText: r.review,
        status: 'published',
        datePosted: r.createdAt
      };
    });

    return res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        total: formattedReviews.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
