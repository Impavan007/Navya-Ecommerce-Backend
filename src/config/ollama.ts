import dotenv from 'dotenv';

dotenv.config();

export const OLLAMA_CONFIG = {
  baseUrl: process.env.OLLAMA_BASE_URL || 'https://ollama.com/api',
  model: process.env.OLLAMA_MODEL || 'llama3',
  apiKey: process.env.OLLAMA_API_KEY || '',
  temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
  numCtx: parseInt(process.env.OLLAMA_NUM_CTX || '4096', 10),
};
