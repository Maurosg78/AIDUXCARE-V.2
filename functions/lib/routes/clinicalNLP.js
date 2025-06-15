"use strict";
/**
 * 🧠 CLINICAL NLP ROUTES
 * Rutas para análisis de entidades clínicas usando Google Cloud Healthcare NLP
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clinicalNLP_1 = require("../api/clinicalNLP");
const router = (0, express_1.Router)();
// POST /api/clinical-nlp/analyze - Analizar entidades clínicas en texto
router.post('/analyze', clinicalNLP_1.analyzeClinicalEntities);
// GET /api/clinical-nlp/analysis/:sessionId - Obtener análisis guardado
router.get('/analysis/:sessionId', clinicalNLP_1.getClinicalAnalysis);
// GET /api/clinical-nlp/usage-stats - Estadísticas de uso y costos
router.get('/usage-stats', clinicalNLP_1.getNLPUsageStats);
exports.default = router;
//# sourceMappingURL=clinicalNLP.js.map