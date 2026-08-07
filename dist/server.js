"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    // Connect to Database
    await (0, db_1.connectDB)();
    // Listen
    app_1.default.listen(PORT, () => {
        console.log(`📡 E-Commerce backend listening on port ${PORT}`);
        console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1`);
    });
};
startServer();
