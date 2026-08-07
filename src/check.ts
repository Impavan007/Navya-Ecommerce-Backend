import mongoose from 'mongoose';
import Product from './models/Product';
import { connectDB } from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  await connectDB();
  const count = await Product.countDocuments({});
  console.log('--- Database Check ---');
  console.log(`Total Products in DB: ${count}`);
  
  if (count > 0) {
    const products = await Product.find({}).limit(5);
    console.log('Sample Product IDs & Names:');
    products.forEach(p => {
      console.log(`- ID: "${p._id}" | Name: "${p.name}" | Status: "${p.status}"`);
    });
  } else {
    console.log('Database has no products seeded!');
  }
  process.exit(0);
};

run();
