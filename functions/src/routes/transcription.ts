/**
 * 🎤 TRANSCRIPTION ROUTES - ESCUCHA ACTIVA
 * Rutas para los endpoints de transcripción con Google Speech-to-Text
 */

import { Router } from "express";
import { transcribeAudio, getTranscriptionHistory } from "../api/transcription";

const router = Router();

// === ENDPOINTS PRINCIPALES ===

// POST /api/transcription - Transcribir audio
router.post("/", transcribeAudio);

// GET /api/transcription/history/:sessionId - Obtener historial de transcripción
router.get("/history/:sessionId", getTranscriptionHistory);

export default router;
