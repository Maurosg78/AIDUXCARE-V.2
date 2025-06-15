/**
 * 🎤 TRANSCRIPTION ROUTES - ESCUCHA ACTIVA
 * Rutas para los endpoints de transcripción con Google Speech-to-Text
 */

import * as express from 'express';
import {
  processTranscription,
  getTranscriptionStatus
} from '../api/transcription';

const router = express.Router();

// === ENDPOINTS PRINCIPALES ===

// POST /api/transcription - Procesar audio y devolver transcripción
router.post('/', processTranscription);

// GET /api/transcription/status/:sessionId - Obtener estado de transcripción
router.get('/status/:sessionId', getTranscriptionStatus);

export default router; 