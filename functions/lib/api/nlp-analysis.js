"use strict";
/**
 * 🧠 NLP ANALYSIS API - GOOGLE CLOUD HEALTHCARE NLP
 * Endpoint para análisis de entidades médicas - Prioridad #4
 * Procesa transcripciones y extrae entidades clínicas estructuradas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNLPAnalysisStatus = exports.processNLPAnalysis = void 0;
const uuid_1 = require("uuid");
const admin = require("firebase-admin");
const healthcare_1 = require("@googleapis/healthcare");
// === CONFIGURACIÓN REAL DE GOOGLE CLOUD HEALTHCARE NLP ===
const initializeHealthcareClient = () => {
    try {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCLOUD_PROJECT || 'aiduxcare-mvp-prod';
        // Inicializar cliente de Healthcare API
        const healthcareClient = (0, healthcare_1.healthcare)({
            version: 'v1'
        });
        console.log(`✅ Healthcare NLP Client inicializado para proyecto: ${projectId}`);
        return healthcareClient;
    }
    catch (error) {
        console.error('❌ Error inicializando Healthcare Client:', error);
        throw new Error(`Error de configuración de Google Cloud Healthcare: ${error}`);
    }
};
// Inicializar cliente global
const healthcareClient = initializeHealthcareClient();
// === MAPEO DE CATEGORÍAS DE ENTIDADES ===
const mapEntityCategory = (googleCategory) => {
    const categoryMap = {
        'SYMPTOM': 'SYMPTOM',
        'SIGN_SYMPTOM': 'SYMPTOM',
        'MEDICATION': 'MEDICATION',
        'MEDICINE': 'MEDICATION',
        'ANATOMY': 'BODY_PART',
        'BODY_PART': 'BODY_PART',
        'MEDICAL_CONDITION': 'CONDITION',
        'CONDITION': 'CONDITION',
        'MEDICAL_PROCEDURE': 'TREATMENT',
        'PROCEDURE': 'TREATMENT',
        'TREATMENT': 'TREATMENT',
        'VITAL_SIGN': 'VITAL_SIGN',
        'TIME': 'TEMPORAL',
        'TEMPORAL': 'TEMPORAL',
        'SEVERITY': 'SEVERITY',
        'FREQUENCY': 'FREQUENCY'
    };
    return categoryMap[googleCategory.toUpperCase()] || 'OTHER';
};
// === ANÁLISIS INTELIGENTE DE SECCIONES SOAP ===
const classifySOAPSection = (text, speakerRole) => {
    const subjectivePatterns = [
        /me duele/i, /siento/i, /tengo/i, /desde hace/i, /cuando/i, /dolor/i,
        /molesta/i, /incomoda/i, /no puedo/i, /dificultad/i
    ];
    const objectivePatterns = [
        /observo/i, /palpo/i, /examino/i, /rango de movimiento/i, /flexión/i,
        /extensión/i, /contractura/i, /inflamación visible/i, /edema/i
    ];
    const assessmentPatterns = [
        /diagnóstico/i, /evaluación/i, /considero/i, /parece/i, /probable/i,
        /compatible con/i, /sugiere/i, /indica/i
    ];
    const planPatterns = [
        /tratamiento/i, /plan/i, /recomiendo/i, /debe/i, /ejercicios/i,
        /terapia/i, /próxima sesión/i, /continuar/i, /medicación/i
    ];
    // Contar coincidencias
    const subjectiveScore = subjectivePatterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
    const objectiveScore = objectivePatterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
    const assessmentScore = assessmentPatterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
    const planScore = planPatterns.reduce((score, pattern) => score + (pattern.test(text) ? 1 : 0), 0);
    // Determinar sección basada en puntuación y rol del hablante
    const scores = [
        { section: 'SUBJECTIVE', score: subjectiveScore + (speakerRole === 'PATIENT' ? 2 : 0) },
        { section: 'OBJECTIVE', score: objectiveScore + (speakerRole === 'THERAPIST' ? 1 : 0) },
        { section: 'ASSESSMENT', score: assessmentScore + (speakerRole === 'THERAPIST' ? 2 : 0) },
        { section: 'PLAN', score: planScore + (speakerRole === 'THERAPIST' ? 2 : 0) }
    ];
    const maxScore = Math.max(...scores.map(s => s.score));
    const bestSection = scores.find(s => s.score === maxScore);
    return (bestSection === null || bestSection === void 0 ? void 0 : bestSection.section) || 'SUBJECTIVE';
};
// === PROCESAMIENTO PRINCIPAL DE NLP ===
const processNLPAnalysis = async (req, res) => {
    const startTime = Date.now();
    try {
        console.log('🧠 Iniciando análisis NLP con Google Cloud Healthcare...');
        // Validar datos de entrada
        const { transcriptionText, sessionId, segments } = req.body;
        if (!transcriptionText) {
            res.status(400).json({
                success: false,
                error: 'Texto de transcripción es requerido'
            });
            return;
        }
        const currentSessionId = sessionId || (0, uuid_1.v4)();
        // === LLAMADA REAL A GOOGLE CLOUD HEALTHCARE NLP ===
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'aiduxcare-mvp-prod';
        const location = 'us-central1'; // Región donde está disponible Healthcare NLP
        console.log('🔄 Enviando texto a Google Cloud Healthcare NLP...');
        console.log(`📊 Texto length: ${transcriptionText.length} caracteres`);
        // Llamada a la API de Healthcare NLP
        const parent = `projects/${projectId}/locations/${location}`;
        const request = {
            parent: parent,
            requestBody: {
                documentContent: transcriptionText,
                licenseType: 'HEALTHCARE_NLP'
            }
        };
        // Realizar análisis de entidades médicas
        const response = await healthcareClient.projects.locations.services.nlp.analyzeEntities(request);
        if (!response.data || !response.data.entities) {
            console.log('⚠️ No se encontraron entidades médicas');
            res.json({
                success: true,
                data: {
                    sessionId: currentSessionId,
                    entities: [],
                    soapSections: [],
                    clinicalSummary: {
                        primarySymptoms: [],
                        medications: [],
                        bodyParts: [],
                        treatments: [],
                        assessments: []
                    },
                    processingTime: Date.now() - startTime,
                    overallConfidence: 0
                }
            });
            return;
        }
        // === PROCESAMIENTO DE ENTIDADES ===
        const entities = [];
        let totalConfidence = 0;
        response.data.entities.forEach((entity, index) => {
            var _a, _b, _c, _d;
            const medicalEntity = {
                id: `entity_${currentSessionId}_${index}`,
                text: entity.mentionText || '',
                category: mapEntityCategory(entity.type || 'OTHER'),
                confidence: entity.confidence || 0.5,
                startOffset: ((_a = entity.mentionId) === null || _a === void 0 ? void 0 : _a.beginOffset) || 0,
                endOffset: ((_b = entity.mentionId) === null || _b === void 0 ? void 0 : _b.endOffset) || 0,
                linkedEntities: ((_c = entity.linkedEntities) === null || _c === void 0 ? void 0 : _c.map((linked) => ({
                    entityId: linked.entityId || '',
                    textExtraction: linked.textExtraction || ''
                }))) || [],
                attributes: ((_d = entity.attributes) === null || _d === void 0 ? void 0 : _d.map((attr) => ({
                    type: attr.type || '',
                    value: attr.value || '',
                    confidence: attr.confidence || 0.5
                }))) || []
            };
            entities.push(medicalEntity);
            totalConfidence += medicalEntity.confidence;
        });
        // === ANÁLISIS DE SECCIONES SOAP ===
        const soapSections = [];
        if (segments && Array.isArray(segments)) {
            segments.forEach((segment) => {
                var _a;
                const speakerRole = ((_a = segment.speaker) === null || _a === void 0 ? void 0 : _a.role) || 'UNKNOWN';
                const soapSection = classifySOAPSection(segment.text, speakerRole);
                // Filtrar entidades relevantes para este segmento
                const segmentEntities = entities.filter(entity => entity.startOffset >= segment.startOffset &&
                    entity.endOffset <= segment.endOffset);
                soapSections.push({
                    section: soapSection,
                    content: segment.text,
                    entities: segmentEntities,
                    confidence: segment.confidence || 0.5,
                    speakerRole: speakerRole
                });
            });
        }
        // === RESUMEN CLÍNICO ===
        const clinicalSummary = {
            primarySymptoms: entities
                .filter(e => e.category === 'SYMPTOM')
                .map(e => e.text)
                .slice(0, 5),
            medications: entities
                .filter(e => e.category === 'MEDICATION')
                .map(e => e.text),
            bodyParts: entities
                .filter(e => e.category === 'BODY_PART')
                .map(e => e.text),
            treatments: entities
                .filter(e => e.category === 'TREATMENT')
                .map(e => e.text),
            assessments: soapSections
                .filter(s => s.section === 'ASSESSMENT')
                .map(s => s.content)
        };
        const result = {
            sessionId: currentSessionId,
            entities,
            soapSections,
            clinicalSummary,
            processingTime: Date.now() - startTime,
            overallConfidence: entities.length > 0 ? totalConfidence / entities.length : 0
        };
        // === GUARDAR EN FIRESTORE ===
        const db = admin.firestore();
        await db.collection('nlp-analysis').doc(currentSessionId).set(Object.assign(Object.assign({}, result), { timestamp: admin.firestore.FieldValue.serverTimestamp(), status: 'completed' }));
        console.log(`✅ Análisis NLP completado en ${result.processingTime}ms`);
        console.log(`📊 Entidades: ${entities.length}, Secciones SOAP: ${soapSections.length}`);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('❌ Error en análisis NLP:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando análisis NLP',
            details: error instanceof Error ? error.message : 'Error desconocido',
            processingTime: Date.now() - startTime
        });
    }
};
exports.processNLPAnalysis = processNLPAnalysis;
// === ENDPOINT DE ESTADO ===
const getNLPAnalysisStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const db = admin.firestore();
        const doc = await db.collection('nlp-analysis').doc(sessionId).get();
        if (!doc.exists) {
            res.status(404).json({
                success: false,
                error: 'Análisis NLP no encontrado'
            });
            return;
        }
        res.json({
            success: true,
            data: doc.data()
        });
    }
    catch (error) {
        console.error('❌ Error obteniendo estado NLP:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estado de análisis NLP'
        });
    }
};
exports.getNLPAnalysisStatus = getNLPAnalysisStatus;
//# sourceMappingURL=nlp-analysis.js.map