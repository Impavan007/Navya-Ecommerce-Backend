import { Request, Response } from 'express';
import axios from 'axios';
import { OLLAMA_CONFIG } from '../config/ollama';
import Product from '../models/Product';

const occasionsList = ['wedding', 'birthday', 'party', 'formal', 'casual', 'meeting', 'date', 'cocktail', 'office'];
const fabricsList = ['silk', 'linen', 'cotton', 'velvet', 'tweed', 'satin', 'wool', 'denim', 'leather', 'lace'];
const colorsList = ['blue', 'red', 'green', 'black', 'white', 'gold', 'silver', 'pink', 'yellow', 'purple', 'beige', 'grey', 'orange', 'emerald'];
const brandsList = ['gucci', 'prada', 'chanel', 'zara', 'navyaa select', 'dior', 'louis vuitton', 'hermes', 'versace'];

// Helper to extract styling parameters from text
function extractKeywords(text: string) {
  const lowercaseText = text.toLowerCase();
  
  const occasion = occasionsList.find(o => lowercaseText.includes(o));
  const fabric = fabricsList.find(f => lowercaseText.includes(f));
  const color = colorsList.find(c => lowercaseText.includes(c));
  const brand = brandsList.find(b => lowercaseText.includes(b));
  
  return { occasion, fabric, color, brand };
}

export const handleStylistChat = async (req: Request, res: Response) => {
  try {
    const { message, chatHistory, type } = req.body;
    console.log(`💬 Incoming AI request type: ${type || 'text'}`);

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // 1. Dynamic Catalog Filtering (RAG) based on user prompt keywords
    const { occasion, fabric, color, brand } = extractKeywords(message);
    console.log(`🔍 AI Stylist detected criteria: Occasion=${occasion || 'none'}, Fabric=${fabric || 'none'}, Color=${color || 'none'}, Brand=${brand || 'none'}`);

    const query: any = { status: 'Active' };
    
    if (occasion) {
      query.occasion = { $regex: occasion, $options: 'i' };
    }
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    // Scan for fabric/color inside name, description, etc.
    const keywordFilters: any[] = [];
    if (color) {
      keywordFilters.push({ name: { $regex: color, $options: 'i' } });
      keywordFilters.push({ description: { $regex: color, $options: 'i' } });
    }
    if (fabric) {
      keywordFilters.push({ name: { $regex: fabric, $options: 'i' } });
      keywordFilters.push({ description: { $regex: fabric, $options: 'i' } });
    }
    if (keywordFilters.length > 0) {
      query.$or = keywordFilters;
    }

    // Query database with limits to optimize context window size
    let products = await Product.find(query)
      .select('name brand price description category')
      .populate('category', 'name')
      .limit(6);

    // Fallback: If no products match the filters, get general featured active products
    if (products.length === 0) {
      console.log(`⚠️ No products matched query filters. Loading default active products.`);
      products = await Product.find({ status: 'Active' })
        .select('name brand price description category')
        .populate('category', 'name')
        .limit(10);
    }

    const productCatalog = products.map(p => ({
      id: p._id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      description: p.description ? (p.description.substring(0, 100) + '...') : '',
      category: (p.category as any)?.name || 'Fashion'
    }));

    // Map history to Ollama's role model structure
    const formattedHistory = (chatHistory || []).map((msg: any) => {
      const role = msg.sender === 'user' ? 'user' : 'assistant';
      return {
        role,
        content: msg.text || ''
      };
    });

    const systemInstruction = `You are "Navyaa AI Stylist", a friendly, highly fashionable personal styling assistant for the Navyaa luxury fashion store.
Your goal is to help users select outfits for various occasions (weddings, parties, casual gatherings, business formal, etc.) from our active catalog.

Here is our active fashion catalog:
${JSON.stringify(productCatalog, null, 2)}

Instructions:
1. Always suggest actual outfits/items from the catalog. Reference them by name and recommend their brands.
2. In your response, whenever you recommend a product from the catalog, you MUST include its ID in double brackets like this: [[PRODUCT_ID: <id>]]. For example: "I suggest the [[PRODUCT_ID: 12345]] for this event."
3. Be stylish, encouraging, polite, and brief. Keep answers under 3-4 sentences when possible.
4. If no products in the catalog fit the description, suggest styling tips generally but explain that we do not have an exact matching item in our catalog right now.`;

    const messagesToSend = [
      { role: 'system', content: systemInstruction },
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    // 2. Set headers for Server-Sent Events (SSE) streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

    // Prepare headers (e.g. authorization header for Ollama cloud hosting proxies/endpoints)
    const headers: Record<string, string> = {};
    if (OLLAMA_CONFIG.apiKey) {
      headers['Authorization'] = `Bearer ${OLLAMA_CONFIG.apiKey}`;
    }

    const cleanBaseUrl = OLLAMA_CONFIG.baseUrl.replace(/\/$/, "");
    const targetUrl = cleanBaseUrl.endsWith("/api")
      ? `${cleanBaseUrl}/chat`
      : `${cleanBaseUrl}/api/chat`;

    // Query Ollama Chat API with streaming enabled
    const ollamaResponse = await axios.post(targetUrl, {
      model: OLLAMA_CONFIG.model,
      messages: messagesToSend,
      options: {
        temperature: OLLAMA_CONFIG.temperature,
        num_ctx: OLLAMA_CONFIG.numCtx
      },
      stream: true
    }, {
      headers,
      responseType: 'stream',
      timeout: 60000 // 60s timeout for stream connection initialization
    });

    // Pipe response stream chunks to SSE
    let buffer = '';
    ollamaResponse.data.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      
      // Store the last partial line back in buffer
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const parsed = JSON.parse(line);
          const text = parsed.message?.content || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
          if (parsed.done) {
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
        } catch (err) {
          // If JSON parse fails, it was a fragmented line, ignore and buffer will collect it
        }
      }
    });

    ollamaResponse.data.on('end', () => {
      // Process remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          const text = parsed.message?.content || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        } catch (e) {}
      }
      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    });

    ollamaResponse.data.on('error', (err: any) => {
      console.error('❌ Ollama Stream Error:', err);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
        res.end();
      }
    });

  } catch (error: any) {
    console.error('❌ Ollama AI Stylist Error:', error.message || error);
    
    if (error.response) {
      console.error('❌ Ollama AI Stylist Error Response Data:', JSON.stringify(error.response.data));
    }

    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

// Free Google Translate Text-to-Speech proxy service (CORS-safe, key-free)
export const handleTtsProxy = async (req: Request, res: Response) => {
  try {
    const { text } = req.query;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text parameter is required' });
    }

    console.log(`🗣️ Requesting TTS synthesis for: "${text}"`);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(String(text))}&tl=en&client=tw-ob`;
    
    const response = await axios({
      method: 'get',
      url: ttsUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error: any) {
    console.error('❌ TTS Proxy Error:', error.message || error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
