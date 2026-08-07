"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const axios_1 = __importDefault(require("axios"));
const User_1 = __importDefault(require("./models/User"));
const Product_1 = __importDefault(require("./models/Product"));
const Category_1 = __importDefault(require("./models/Category"));
const Settings_1 = __importDefault(require("./models/Settings"));
const Cart_1 = __importDefault(require("./models/Cart"));
const Wishlist_1 = __importDefault(require("./models/Wishlist"));
const db_1 = require("./config/db");
const seed = async () => {
    try {
        console.log('🌱 Starting database seed script...');
        await (0, db_1.connectDB)();
        // 1. Clear database
        console.log('🧹 Clearing old collections...');
        await User_1.default.deleteMany({});
        await Product_1.default.deleteMany({});
        await Category_1.default.deleteMany({});
        await Settings_1.default.deleteMany({});
        await Cart_1.default.deleteMany({});
        await Wishlist_1.default.deleteMany({});
        // 2. Create default settings
        console.log('⚙️ Creating default settings...');
        const settings = new Settings_1.default({
            title: 'Navyaa fashion',
            description: 'The premium women luxury fashion e-commerce marketplace',
            email: 'hello@navyaa.com',
            website_url: 'http://localhost:3000',
            logo: '/logo.png',
            favicon: '/favicon.ico',
            social_links: {
                instagram: 'https://instagram.com/navyaa',
                facebook: 'https://facebook.com/navyaa'
            },
            meta_title: {
                title: 'Navyaa | Women Luxury Fashion Purchase Platform',
                description: 'Buy premium women clothing, accessories, and jewelry.',
                keyword: 'fashion, women, luxury, clothes, e-commerce'
            }
        });
        await settings.save();
        // 3. Create default users
        console.log('👤 Creating default users...');
        const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
        const customer = new User_1.default({
            name: 'Jane Customer',
            email: 'customer@navyaa.com',
            password: hashedPassword,
            phone: '+33 6 1234 5678',
            role: 'buyer',
            status: 'Active',
            addresses: [{
                    label: 'Home',
                    street_name: 'Rue de la Paix',
                    house_number: '12',
                    city: 'Paris',
                    postal_code: '75002',
                    is_primary: true
                }]
        });
        await customer.save();
        await new Cart_1.default({ user: customer._id, items: [] }).save();
        await new Wishlist_1.default({ user: customer._id, products: [] }).save();
        const seller = new User_1.default({
            name: 'Navyaa Boutique',
            email: 'seller@navyaa.com',
            password: hashedPassword,
            phone: '+33 6 9876 5432',
            role: 'seller',
            status: 'Active',
            is_top_lender: true,
            addresses: [{
                    label: 'Showroom',
                    street_name: 'Avenue Montaigne',
                    house_number: '25',
                    city: 'Paris',
                    postal_code: '75008',
                    is_primary: true
                }]
        });
        await seller.save();
        await new Cart_1.default({ user: seller._id, items: [] }).save();
        await new Wishlist_1.default({ user: seller._id, products: [] }).save();
        const admin = new User_1.default({
            name: 'Super administrator',
            email: 'admin@navyaa.com',
            password: hashedPassword,
            phone: '+33 6 0000 0000',
            role: 'admin',
            status: 'Active'
        });
        await admin.save();
        await new Cart_1.default({ user: admin._id, items: [] }).save();
        await new Wishlist_1.default({ user: admin._id, products: [] }).save();
        // 4. Create Categories
        console.log('🗂️ Creating categories...');
        const catClothing = new Category_1.default({ name: 'Clothing', slug: 'clothing', description: 'Designer women apparel' });
        await catClothing.save();
        const catBags = new Category_1.default({ name: 'Bags', slug: 'bags', description: 'Luxury designer handbags' });
        await catBags.save();
        const catShoes = new Category_1.default({ name: 'Shoes', slug: 'shoes', description: 'Premium footwear' });
        await catShoes.save();
        const catAccessories = new Category_1.default({ name: 'Accessories', slug: 'accessories', description: 'Designer jewelry and accessories' });
        await catAccessories.save();
        const subWomensClothing = new Category_1.default({ name: 'Womens Clothing', slug: 'womens-clothing', parent: catClothing._id });
        await subWomensClothing.save();
        catClothing.sub_categories.push(subWomensClothing._id);
        await catClothing.save();
        // 5. Fetch and seed products
        console.log('🛍️ Seeding products from FakeStoreAPI...');
        let fakeProducts = [];
        try {
            const responseClothing = await axios_1.default.get("https://fakestoreapi.com/products/category/women's%20clothing");
            const responseJewelery = await axios_1.default.get("https://fakestoreapi.com/products/category/jewelery");
            fakeProducts = [...(responseClothing.data || []), ...(responseJewelery.data || [])];
        }
        catch (e) {
            console.warn('⚠️ Unable to connect to FakeStoreAPI. Using fallback offline products.');
            fakeProducts = [
                { id: 15, title: "BIYLACLESEN Women's 3-in-1 Snowboard Jacket", description: "Elegant winter coat.", price: 56.99, category: "women's clothing", image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500' },
                { id: 16, title: "Lock and Love Women's Removable Hooded Moto Jacket", description: "Stylish faux leather jacket.", price: 29.95, category: "women's clothing", image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500' },
                { id: 5, title: "John Hardy Women's Naga Station Chain Bracelet", description: "Designer gold and silver station bracelet.", price: 695, category: "jewelery", image: 'https://images.unsplash.com/photo-1611085583191-a3b1a3a355db?w=500' }
            ];
        }
        const sizes = ['XS', 'S', 'M', 'L', 'XL'];
        const occasions = ['Formal', 'Casual', 'Cocktail', 'Party', 'Wedding'];
        for (const item of fakeProducts) {
            // Map category names to mongoose categories
            let targetCat = catClothing._id;
            let targetSubCat = subWomensClothing._id;
            const categoryName = String(item.category || '').toLowerCase();
            if (categoryName.includes('jewel') || categoryName.includes('accessory')) {
                targetCat = catAccessories._id;
                targetSubCat = undefined;
            }
            // Random sizes and occasion
            const numSizes = Math.floor(Math.random() * 3) + 2;
            const productSizes = sizes.sort(() => 0.5 - Math.random()).slice(0, numSizes);
            const occasion = occasions[Math.floor(Math.random() * occasions.length)];
            const product = new Product_1.default({
                _id: String(item.id),
                lender: seller._id,
                name: item.title,
                description: item.description,
                brand: 'Navyaa Select',
                occasion,
                size: productSizes,
                price: item.price,
                rental_price_per_day: item.price,
                cleaning_fee: 0,
                security_deposit: 0,
                blocked_dates: [],
                images: [item.image || 'https://via.placeholder.com/300'],
                cover_image: item.image || 'https://via.placeholder.com/300',
                quantity: Math.floor(Math.random() * 20) + 5,
                status: 'Active',
                category: targetCat,
                sub_category: targetSubCat,
                rating: item.rating?.rate || (Math.floor(Math.random() * 2) + 3.8),
                rating_count: item.rating?.count || Math.floor(Math.random() * 40) + 5,
                terms_and_condition: true,
                is_featured: Math.random() > 0.4
            });
            await product.save();
        }
        console.log(`🎉 Database seeded successfully for Navyaa! Created:`);
        console.log(`- 3 Users (Buyer: customer@navyaa.com, seller: seller@navyaa.com, admin: admin@navyaa.com)`);
        console.log(`- ${await Category_1.default.countDocuments()} Categories & Subcategories`);
        console.log(`- ${await Product_1.default.countDocuments()} Seeded Products`);
        console.log(`- 1 Default Settings instance`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};
seed();
