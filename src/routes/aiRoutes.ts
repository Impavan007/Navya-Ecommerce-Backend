import { Router } from 'express';
import { 
  handleStylistChat, 
  handleTtsProxy 
} from '../controllers/aiController';

const router = Router();

// Text Stylist Chat (handles text prompts sent by browser transcription or typing)
router.post('/ai/stylist/chat', handleStylistChat);

// Text-to-Speech Proxy (streams synthetic voices back key-free)
router.get('/ai/stylist/tts', handleTtsProxy);

export default router;
