"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const router = (0, express_1.Router)();
// Text Stylist Chat (handles text prompts sent by browser transcription or typing)
router.post('/ai/stylist/chat', aiController_1.handleStylistChat);
// Text-to-Speech Proxy (streams synthetic voices back key-free)
router.get('/ai/stylist/tts', aiController_1.handleTtsProxy);
exports.default = router;
