"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/setting', settingsController_1.getSettings);
router.post('/admin/setting', auth_1.authMiddleware, settingsController_1.updateSettings);
exports.default = router;
