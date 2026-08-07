import { Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Public Catalog GET /api/v1/products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      min_price,
      max_price,
      is_featured,
      sizes,
      sort,
      q,
      fabric,
      top_lenders,
      available
    } = req.query;

    const query: any = {};

    if (category && category !== 'All') {
      // Find category by slug, name or ID
      const catQuery = mongoose.Types.ObjectId.isValid(String(category))
        ? { _id: String(category) }
        : { $or: [{ slug: String(category) }, { name: String(category) }] };
      
      const cat = await Category.findOne(catQuery);
      if (cat) {
        // Can match category OR sub_category
        query.$or = [
          { category: cat._id },
          { sub_category: cat._id }
        ];
      }
    }

    const searchQuery = String(search || q || '').trim();
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { brand: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = Number(min_price);
      if (max_price) query.price.$lte = Number(max_price);
    }

    if (is_featured === 'true') {
      query.is_featured = true;
    }

    if (sizes) {
      const sizesArray = String(sizes).split(',').map(s => s.trim()).filter(Boolean);
      if (sizesArray.length > 0) {
        query.size = { $in: sizesArray };
      }
    }

    if (fabric) {
      const fabricStr = String(fabric).toLowerCase();
      query.fabric = { $regex: fabricStr, $options: 'i' };
    }

    if (top_lenders === 'true') {
      const topSellers = await User.find({ is_top_lender: true }).select('_id');
      const topSellerIds = topSellers.map(s => s._id);
      query.lender = { $in: topSellerIds };
    }

    if (available === 'true') {
      query.quantity = { $gt: 0 };
    }

    // Only show Active products in public catalog
    query.status = 'Active';

    // Sorting
    let sortOptions: any = { createdAt: -1 };
    if (sort === 'price_low' || sort === 'priceLowToHigh') sortOptions = { price: 1 };
    else if (sort === 'price_high' || sort === 'priceHighToLow') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };

    const skipIndex = (Number(page) - 1) * Number(limit);
    const totalItems = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category')
      .populate('lender', 'name email profile_image is_top_lender')
      .sort(sortOptions)
      .skip(skipIndex)
      .limit(Number(limit));

    const totalPages = Math.ceil(totalItems / Number(limit));

    const formattedProducts = products.map(p => {
      const pObj = p.toObject();
      return {
        ...pObj,
        id: p._id,
        rentalPrice: p.price
      };
    });

    return res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          totalItems,
          totalPages,
          currentPage: Number(page),
          pageSize: Number(limit),
          hasNextPage: Number(page) < totalPages,
          hasPrevPage: Number(page) > 1
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/product/:id
export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    let product = await Product.findOne({ _id: id })
      .populate('category')
      .populate('sub_category')
      .populate('lender', 'name email profile_image is_top_lender');

    if (!product && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id)
        .populate('category')
        .populate('sub_category')
        .populate('lender', 'name email profile_image is_top_lender');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Mock pricing calculations structure matching frontend expectation
    const pricingOptions = [
      { duration: 4, label: '4 Days', discount: 0, pricePerDay: product.price, totalPrice: product.price * 4, breakdown: { rental: product.price * 4, cleaning_fee: 0, security_deposit: 0, total: product.price * 4 } },
      { duration: 7, label: '7 Days', discount: 10, pricePerDay: product.price * 0.9, totalPrice: product.price * 0.9 * 7, breakdown: { rental: product.price * 0.9 * 7, cleaning_fee: 0, security_deposit: 0, total: product.price * 0.9 * 7 } },
      { duration: 14, label: '14 Days', discount: 20, pricePerDay: product.price * 0.8, totalPrice: product.price * 0.8 * 14, breakdown: { rental: product.price * 0.8 * 14, cleaning_fee: 0, security_deposit: 0, total: product.price * 0.8 * 14 } }
    ];

    const data = product.toObject() as any;
    data.id = product._id;
    data.rentalPrice = product.price;
    data.pricing = {
      base_price_per_day: product.price,
      cleaning_fee: 0,
      security_deposit: 0,
      options: pricingOptions
    };

    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Similar products & more from lender /api/v1/products/similar-and-more/:id
export const getSimilarAndMore = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    let product = await Product.findOne({ _id: id });
    if (!product && mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const similar = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'Active'
    }).limit(4);

    const moreFromLender = await Product.find({
      lender: product.lender,
      _id: { $ne: product._id },
      status: 'Active'
    }).limit(4);

    const formatProduct = (p: any) => {
      const pObj = p.toObject();
      return {
        ...pObj,
        id: p._id,
        rentalPrice: p.price
      };
    };

    return res.json({
      success: true,
      data: {
        similar: similar.map(formatProduct),
        moreFromLender: moreFromLender.map(formatProduct)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Search suggestions /api/v1/products/search/suggestions
export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const { q = '' } = req.query;
    const queryStr = String(q).trim();

    if (!queryStr) {
      return res.json({ success: true, data: { suggestions: [], searchTerm: '' } });
    }

    const products = await Product.find({
      name: { $regex: queryStr, $options: 'i' },
      status: 'Active'
    }).limit(5);

    const suggestions = products.map((p) => ({
      type: 'product',
      value: p.name,
      display: p.name
    }));

    return res.json({
      success: true,
      data: {
        suggestions,
        searchTerm: queryStr
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public GET by lender ID /api/v1/product-bylender/:lenderId
export const getProductsByLender = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ lender: req.params.lenderId, status: 'Active' });

    const formattedProducts = products.map(p => {
      const pObj = p.toObject();
      return {
        ...pObj,
        id: p._id,
        rentalPrice: p.price
      };
    });

    return res.json({
      success: true,
      data: {
        products: formattedProducts,
        lender: { id: req.params.lenderId, name: 'Lender Name', joinedDate: new Date() }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// seller GET /api/v1/lender/products (Retrieve seller's listings)
export const getLenderProducts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { status, category, brand, search, page = 1, limit = 10 } = req.query;
    const query: any = { lender: req.user.id };

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (brand && brand !== 'all') query.brand = brand;

    if (search) {
      query.name = { $regex: String(search), $options: 'i' };
    }

    const skipIndex = (Number(page) - 1) * Number(limit);
    const totalItems = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category')
      .skip(skipIndex)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalItems / Number(limit));

    // Dynamic stats summary for statuses
    const rawCounts = await Product.aggregate([
      { $match: { lender: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const status_summary: any = { all: totalItems, active: 0, pending: 0, draft: 0, inactive: 0 };
    rawCounts.forEach((rc) => {
      const statusKey = String(rc._id).toLowerCase();
      status_summary[statusKey] = rc.count;
    });

    // Formatting return matching IListing
    const formattedProducts = products.map(p => ({
      id: p._id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      rentalPrice: p.price,
      price: p.price,
      status: p.status,
      cover_image: p.cover_image,
      images: p.images
    }));

    return res.json({
      success: true,
      data: {
        products: formattedProducts,
        pagination: {
          totalItems,
          totalPages,
          currentPage: Number(page),
          pageSize: Number(limit),
          hasNextPage: Number(page) < totalPages,
          hasPrevPage: Number(page) > 1
        },
        lender_status: 'Active',
        status_summary
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// seller Step-by-Step Listing POST /api/v1/lender/listing/step
export const saveListingStep = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { step, productId } = req.body;
    const stepNum = Number(step);

    if (stepNum === 1) {
      // Step 1: Basic Info
      const { name, category, sub_category, fabric, size, brand, quantity, description, price, rental_price_per_day } = req.body;

      // Get category or default
      let categoryId = category;
      if (!mongoose.Types.ObjectId.isValid(category)) {
        const found = await Category.findOne({ slug: String(category).toLowerCase() });
        categoryId = found ? found._id : new mongoose.Types.ObjectId();
      }

      let subCategoryId = undefined;
      if (sub_category && mongoose.Types.ObjectId.isValid(sub_category)) {
        subCategoryId = new mongoose.Types.ObjectId(sub_category);
      }

      const targetPrice = Number(price || rental_price_per_day) || 0;

      const product = new Product({
        _id: new mongoose.Types.ObjectId().toString(),
        lender: req.user.id,
        name: name || 'Untitled Product',
        description: description || '',
        brand: brand || 'Generic',
        fabric: fabric || 'Cotton',
        size: Array.isArray(size) ? size : [size || 'M'],
        price: targetPrice,
        rental_price_per_day: targetPrice,
        cover_image: '',
        quantity: Number(quantity) || 10,
        category: categoryId,
        sub_category: subCategoryId,
        status: 'Draft'
      });

      await product.save();
      return res.status(201).json({ success: true, data: { product } });
    }

    // Step 2, 3, 4 require a Product ID
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required for step ' + stepNum });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (stepNum === 2) {
      // Step 2: Pricing
      const { rental_price_per_day, cleaning_fee, security_deposit } = req.body;
      product.price = Number(rental_price_per_day) || 0;
      product.rental_price_per_day = Number(rental_price_per_day) || 0;
      product.cleaning_fee = Number(cleaning_fee) || 0;
      product.security_deposit = Number(security_deposit) || 0;
      await product.save();
      return res.json({ success: true, data: { product } });
    }

    if (stepNum === 3) {
      // Step 3: Photos
      const coverImage = req.files && (req.files as any).coverImage ? (req.files as any).coverImage[0] : null;
      const productImages = req.files && (req.files as any).productImages ? (req.files as any).productImages : [];

      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      if (coverImage) {
        product.cover_image = baseUrl + '/api/v1/Productimages/' + coverImage.filename;
      }
      if (productImages.length > 0) {
        product.images = productImages.map((f: any) => baseUrl + '/api/v1/Productimages/' + f.filename);
      }
      await product.save();
      return res.json({ success: true, data: { product } });
    }

    if (stepNum === 4) {
      // Step 4: Finalize & Status
      const { status = 'Pending', blocked_dates } = req.body;
      product.status = status;
      if (blocked_dates) product.blocked_dates = blocked_dates;
      await product.save();
      return res.json({ success: true, data: { product } });
    }

    return res.status(400).json({ success: false, message: 'Invalid step' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// seller update product: POST /api/v1/lender/product/:id/update
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Ensure user owns this listing
    if (product.lender.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { name, brand, description, category, sub_category, subcategory, fabric, size, rental_price_per_day, quantity } = req.body;

    if (name) product.name = name;
    if (brand) product.brand = brand;
    if (description) product.description = description;
    if (fabric) product.fabric = fabric;
    if (size) product.size = Array.isArray(size) ? size : JSON.parse(size);
    if (quantity) product.quantity = Number(quantity);

    if (rental_price_per_day) {
      product.price = Number(rental_price_per_day);
      product.rental_price_per_day = Number(rental_price_per_day);
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        product.category = new mongoose.Types.ObjectId(category);
      }
    }

    const targetSubCategory = sub_category || subcategory;
    if (targetSubCategory) {
      if (mongoose.Types.ObjectId.isValid(targetSubCategory)) {
        product.sub_category = new mongoose.Types.ObjectId(targetSubCategory);
      }
    }

    // Handle photo uploads in Edit / Update mode
    const coverImage = req.files && (req.files as any).coverImage ? (req.files as any).coverImage[0] : null;
    const productImages = req.files && (req.files as any).productImages ? (req.files as any).productImages : [];

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    if (coverImage) {
      product.cover_image = baseUrl + '/api/v1/Productimages/' + coverImage.filename;
    } else if (req.body.coverImageUrl) {
      product.cover_image = req.body.coverImageUrl;
    }

    if (productImages.length > 0) {
      const newImages = productImages.map((f: any) => baseUrl + '/api/v1/Productimages/' + f.filename);
      let existingUrls: string[] = [];
      if (req.body.imageUrls) {
        existingUrls = Array.isArray(req.body.imageUrls) 
          ? req.body.imageUrls 
          : [req.body.imageUrls];
      }
      product.images = [...existingUrls, ...newImages];
    } else if (req.body.imageUrls) {
      product.images = Array.isArray(req.body.imageUrls) 
        ? req.body.imageUrls 
        : [req.body.imageUrls];
    }

    await product.save();

    return res.json({ success: true, message: 'Product updated successfully', data: { updatedProduct: product } });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// seller update single product status POST /api/v1/lender/product/:id/status
export const updateProductStatus = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.lender.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    product.status = req.body.status;
    await product.save();

    return res.json({ success: true, message: 'Status updated', data: product });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete single product listing DELETE /api/v1/lender/product/:id/delete
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (product.lender.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Product.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete images from listing
export const deleteProductImage = async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { image } = req.body;
    product.images = product.images.filter(img => img !== image);
    await product.save();
    return res.json({ success: true, message: 'Image deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk Actions POST /api/v1/lender/products/bulk/action
export const bulkListingAction = async (req: AuthRequest, res: Response) => {
  try {
    const { action, productIds, status, blockedDates } = req.body;

    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No productIds provided' });
    }

    if (action === 'delete') {
      await Product.deleteMany({ _id: { $in: productIds }, lender: req.user?.id });
    } else if (action === 'updateStatus') {
      await Product.updateMany(
        { _id: { $in: productIds }, lender: req.user?.id },
        { status: status || 'Inactive' }
      );
    } else if (action === 'addBlockDates' && blockedDates) {
      // Mock blocking logic
      await Product.updateMany(
        { _id: { $in: productIds }, lender: req.user?.id },
        { blocked_dates: blockedDates }
      );
    }

    return res.json({ success: true, message: 'Bulk action applied' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
