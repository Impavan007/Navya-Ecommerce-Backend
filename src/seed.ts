import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';
import Product from './models/Product';
import Category from './models/Category';
import Settings from './models/Settings';
import Cart from './models/Cart';
import Wishlist from './models/Wishlist';
import { connectDB } from './config/db';

dotenv.config();

const productsData = [
  {
    _id: "p-1",
    name: "Organic Cotton Canvas 240GSM",
    description: "Heavy-duty 100% organic cotton canvas, ideal for tote bags, upholstery, and structured garments. GOTS certified.",
    brand: "EcoWeave Textiles",
    fabric: "Organic Cotton",
    size: ["150cm width"],
    price: 350,
    cover_image: "https://images.unsplash.com/photo-1596205739958-8eb02f1a6f87?w=800",
    sub_category_slug: "woven-fabrics",
    is_featured: true
  },
  {
    _id: "p-2",
    name: "Premium Silk Crepe de Chine",
    description: "Luxurious, lightweight silk crepe de chine with a fluid drape and subtle sheen. Perfect for evening wear and blouses.",
    brand: "Silk Road Looms",
    fabric: "Woven Fabrics",
    size: ["114cm width"],
    price: 1800,
    cover_image: "https://images.unsplash.com/photo-1601377850244-1246c76fcffb?w=800",
    sub_category_slug: "woven-fabrics",
    is_featured: true
  },
  {
    _id: "p-3",
    name: "Recycled Polyester Mesh",
    description: "Breathable and durable recycled polyester mesh fabric, perfect for activewear and lining.",
    brand: "TechTex Innovations",
    fabric: "Technical Textiles",
    size: ["160cm width"],
    price: 120,
    cover_image: "https://images.unsplash.com/photo-1563851509675-905cbb66aeb5?w=800",
    sub_category_slug: "knit-fabrics",
    is_featured: false
  },
  {
    _id: "p-4",
    name: "Heavyweight Raw Denim 14oz",
    description: "Premium Japanese selvedge raw denim. Stiff and durable, develops beautiful fades over time.",
    brand: "Indigo Mills",
    fabric: "Denim",
    size: ["80cm width"],
    price: 650,
    cover_image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=800",
    sub_category_slug: "woven-fabrics",
    is_featured: true
  },
  {
    _id: "p-5",
    name: "Sustainable Bamboo Jersey",
    description: "Ultra-soft, breathable bamboo viscose jersey knit. Hypoallergenic and thermo-regulating.",
    brand: "GreenLeaf Knits",
    fabric: "Sustainable Textiles",
    size: ["150cm width"],
    price: 280,
    cover_image: "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800",
    sub_category_slug: "knit-fabrics",
    is_featured: true
  },
  {
    _id: "p-6",
    name: "French Terry Fleece 300GSM",
    description: "Thick, loop-back French terry made from 100% cotton. Ideal for premium loungewear and hoodies.",
    brand: "ComfortWeave",
    fabric: "Knit Fabrics",
    size: ["180cm width"],
    price: 450,
    cover_image: "https://images.unsplash.com/photo-1599859549397-9e6b487c674b?w=800",
    sub_category_slug: "knit-fabrics",
    is_featured: false
  },
  {
    _id: "p-7",
    name: "Digital Print Chiffon",
    description: "Lightweight, sheer polyester chiffon featuring high-definition custom digital floral prints.",
    brand: "PrintMasters",
    fabric: "Printed Fabrics",
    size: ["140cm width"],
    price: 150,
    cover_image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800",
    sub_category_slug: "woven-fabrics",
    is_featured: false
  },
  {
    _id: "p-8",
    name: "GOTS Certified Linen Flax",
    description: "Pure European linen flax fabric. Highly breathable, naturally antibacterial, and softens with every wash.",
    brand: "EuroLinen",
    fabric: "Sustainable Textiles",
    size: ["140cm width"],
    price: 750,
    cover_image: "https://images.unsplash.com/photo-1624956891669-e7d6928e4695?w=800",
    sub_category_slug: "woven-fabrics",
    is_featured: true
  },
  {
    _id: "p-9",
    name: "Stretch Scuba Knit",
    description: "Double-knit scuba fabric with excellent recovery and structure. Ideal for form-fitting dresses and activewear.",
    brand: "TechTex Innovations",
    fabric: "Technical Textiles",
    size: ["150cm width"],
    price: 320,
    cover_image: "https://images.unsplash.com/photo-1563851509675-905cbb66aeb5?w=800",
    sub_category_slug: "knit-fabrics",
    is_featured: false
  },
  {
    _id: "p-10",
    name: "Embroidered Tulle Lace",
    description: "Intricate floral embroidered lace on a soft tulle base. Perfect for bridal and evening wear overlays.",
    brand: "Lace & Co.",
    fabric: "Trims & Accessories",
    size: ["130cm width"],
    price: 1200,
    cover_image: "https://images.unsplash.com/photo-1591141386762-0c98f98c4749?w=800",
    sub_category_slug: "trims",
    is_featured: true
  },
  {
    _id: "p-11",
    name: "Water-Repellent Ripstop Nylon",
    description: "Durable, tear-resistant ripstop nylon with a DWR (Durable Water Repellent) finish. Ideal for outerwear.",
    brand: "TechTex Innovations",
    fabric: "Technical Textiles",
    size: ["150cm width"],
    price: 180,
    cover_image: "https://images.unsplash.com/photo-1582260655029-7987e9c5ec6c?w=800",
    sub_category_slug: "woven-fabrics",
    is_featured: false
  },
  {
    _id: "p-12",
    name: "Ribbed Modal Knit",
    description: "Ultra-stretchy 2x2 ribbed knit made from eco-friendly modal fibers. Excellent drape and softness.",
    brand: "GreenLeaf Knits",
    fabric: "Knit Fabrics",
    size: ["120cm width"],
    price: 290,
    cover_image: "https://images.unsplash.com/photo-1596205739958-8eb02f1a6f87?w=800",
    sub_category_slug: "knit-fabrics",
    is_featured: false
  }
];

const seed = async () => {
  try {
    console.log('🌱 Starting Database Seeding Process...');
    await connectDB();

    console.log('🧹 Clearing existing database collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Settings.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
    console.log('✨ Collections cleared');

    console.log('⚙️ Creating Settings...');
    const settings = new Settings({
      platformFeePercentage: 10,
      adminWalletAddress: 'placeholder-wallet-address',
      stripeAccountId: 'placeholder-stripe-account-id'
    });
    await settings.save();
    
    // Create Users (Buyer, Seller, Admin)
    console.log('👤 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const customer = new User({
      name: 'Retail Buyer',
      email: 'customer@navyaa.com',
      password: hashedPassword,
      phone: '+33 6 1234 5678',
      role: 'buyer',
      status: 'Active'
    });
    await customer.save();
    await new Cart({ user: customer._id, items: [] }).save();
    await new Wishlist({ user: customer._id, products: [] }).save();

    const seller = new User({
      name: 'Textile Manufacturer',
      email: 'seller@navyaa.com',
      password: hashedPassword,
      phone: '+33 6 8765 4321',
      role: 'seller',
      status: 'Active',
      switch_account: true,
      bank_account_details: {
        account_name: 'Textile Mills LLC',
        account_number: '123456789012',
        ifsc_code: 'ICIC0001234',
        bank_name: 'ICICI Bank'
      }
    });
    await seller.save();
    await new Cart({ user: seller._id, items: [] }).save();
    await new Wishlist({ user: seller._id, products: [] }).save();

    const admin = new User({
      name: 'Super administrator',
      email: 'admin@navyaa.com',
      password: hashedPassword,
      phone: '+33 6 0000 0000',
      role: 'admin',
      status: 'Active'
    });
    await admin.save();
    await new Cart({ user: admin._id, items: [] }).save();
    await new Wishlist({ user: admin._id, products: [] }).save();

    // Create Categories (Textiles)
    console.log('🗂️ Creating categories...');
    const catTextiles = new Category({ 
      name: 'Textiles & Fabrics', 
      slug: 'textiles', 
      description: 'Premium wholesale fabrics for B2B' 
    });
    await catTextiles.save();

    const subWoven = new Category({ 
      name: 'Woven Fabrics', 
      slug: 'woven-fabrics', 
      parent: catTextiles._id,
      description: 'Silks, Cottons, Linens, Denim'
    });
    await subWoven.save();

    const subKnit = new Category({ 
      name: 'Knit Fabrics', 
      slug: 'knit-fabrics', 
      parent: catTextiles._id,
      description: 'Jerseys, Fleeces, Ribbed Knits'
    });
    await subKnit.save();

    const subTrims = new Category({ 
      name: 'Trims & Accessories', 
      slug: 'trims', 
      parent: catTextiles._id,
      description: 'Laces, Buttons, Zippers, Ribbons'
    });
    await subTrims.save();

    catTextiles.sub_categories = [subWoven._id, subKnit._id, subTrims._id];
    await catTextiles.save();

    const subCategoryMap: Record<string, mongoose.Types.ObjectId> = {
      "woven-fabrics": subWoven._id as mongoose.Types.ObjectId,
      "knit-fabrics": subKnit._id as mongoose.Types.ObjectId,
      "trims": subTrims._id as mongoose.Types.ObjectId,
    };

    // Seed 12 textile products
    console.log('🛍️ Seeding textile products...');
    for (const item of productsData) {
      const subCatId = subCategoryMap[item.sub_category_slug];
      
      const product = new Product({
        _id: item._id,
        lender: seller._id,
        name: item.name,
        description: item.description,
        brand: item.brand,
        fabric: item.fabric,
        size: item.size,
        price: item.price,
        rental_price_per_day: item.price, // Mocking price per meter field
        cleaning_fee: 0,
        security_deposit: 0,
        blocked_dates: [],
        images: [item.cover_image],
        cover_image: item.cover_image,
        quantity: 500, // 500 meters
        status: 'Active',
        category: catTextiles._id,
        sub_category: subCatId,
        rating: +(Math.random() * 0.8 + 4.2).toFixed(1),
        rating_count: Math.floor(Math.random() * 30) + 5,
        terms_and_condition: true,
        is_featured: item.is_featured,
        wishlisted_by: []
      });

      await product.save();
    }

    console.log(`🎉 Database seeded successfully for Navyaa! Created:`);
    console.log(`- 3 Users (Buyer: customer@navyaa.com, seller: seller@navyaa.com, admin: admin@navyaa.com)`);
    console.log(`- ${await Category.countDocuments()} Categories & Subcategories`);
    console.log(`- ${await Product.countDocuments()} Seeded Products (Textiles)`);
    console.log(`- 1 Default Settings instance`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seed();
