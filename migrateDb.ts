import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("MONGO_URI not found");
  process.exit(1);
}

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to MongoDB for migration");
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // Rename occasion to fabric for all documents that have occasion
    const res = await Product.updateMany(
      { occasion: { $exists: true } }, 
      { $rename: { 'occasion': 'fabric' } }
    );
    
    console.log("Migration result:", res);
    process.exit(0);
  })
  .catch(err => {
    console.error("Migration failed", err);
    process.exit(1);
  });
