/**
 * 🧠 CLINICAL NLP ROUTES
 * Rutas para análisis de entidades clínicas usando Google Cloud Healthcare NLP
 */

import { Router } from 'express';
import { 
  analyzeClinicalEntities, 
  getClinicalAnalysis, 
  getNLPUsageStats 
} from '../api/clinicalNLP';

const router = Router();

// POST /api/clinical-nlp/analyze - Analizar entidades clínicas en texto
router.post('/analyze', analyzeClinicalEntities);

// GET /api/clinical-nlp/analysis/:sessionId - Obtener análisis guardado
router.get('/analysis/:sessionId', getClinicalAnalysis);

// GET /api/clinical-nlp/usage-stats - Estadísticas de uso y costos
router.get('/usage-stats', getNLPUsageStats);

export default router; 