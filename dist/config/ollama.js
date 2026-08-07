"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OLLAMA_CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.OLLAMA_CONFIG = {
    baseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com/api',
    model: process.env.OLLAMA_MODEL || 'llama3',
    apiKey: process.env.OLLAMA_API_KEY || '',
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
    numCtx: parseInt(process.env.OLLAMA_NUM_CTX || '4096', 10),
};
