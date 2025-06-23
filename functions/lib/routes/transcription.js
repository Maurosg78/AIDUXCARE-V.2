"use strict";
/**
 * 🎤 TRANSCRIPTION ROUTES - ESCUCHA ACTIVA
 * Rutas para los endpoints de transcripción con Google Speech-to-Text
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transcription_1 = require("../api/transcription");
const router = (0, express_1.Router)();
// === ENDPOINTS PRINCIPALES ===
// POST /api/transcription - Transcribir audio
router.post('/', transcription_1.transcribeAudio);
// GET /api/transcription/history/:sessionId - Obtener historial de transcripción
router.get('/history/:sessionId', transcription_1.getTranscriptionHistory);
exports.default = router;
//# sourceMappingURL=transcription.js.map