"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Product_1 = __importDefault(require("./models/Product"));
const db_1 = require("./config/db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const run = async () => {
    await (0, db_1.connectDB)();
    const count = await Product_1.default.countDocuments({});
    console.log('--- Database Check ---');
    console.log(`Total Products in DB: ${count}`);
    if (count > 0) {
        const products = await Product_1.default.find({}).limit(5);
        console.log('Sample Product IDs & Names:');
        products.forEach(p => {
            console.log(`- ID: "${p._id}" | Name: "${p.name}" | Status: "${p.status}"`);
        });
    }
    else {
        console.log('Database has no products seeded!');
    }
    process.exit(0);
};
run();
