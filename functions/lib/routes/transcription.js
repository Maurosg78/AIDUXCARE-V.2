"use strict";
/**
 * 🎤 TRANSCRIPTION ROUTES - ESCUCHA ACTIVA
 * Rutas para los endpoints de transcripción con Google Speech-to-Text
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const transcription_1 = require("../api/transcription");
const router = express.Router();
// === ENDPOINTS PRINCIPALES ===
// POST /api/transcription - Procesar audio y devolver transcripción
router.post('/', transcription_1.processTranscription);
// GET /api/transcription/status/:sessionId - Obtener estado de transcripción
router.get('/status/:sessionId', transcription_1.getTranscriptionStatus);
exports.default = router;
//# sourceMappingURL=transcription.js.map