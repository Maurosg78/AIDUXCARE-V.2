"use strict";
/**
 * 🎤 TRANSCRIPTION API - GOOGLE SPEECH-TO-TEXT
 * Endpoint para la funcionalidad de "Escucha Activa" - Prioridad #3
 * Procesa audio en tiempo real y devuelve transcripción estructurada
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranscriptionStatus = exports.processTranscription = void 0;
const uuid_1 = require("uuid");
const admin = require("firebase-admin");
const speech_1 = require("@google-cloud/speech");
// === CONFIGURACIÓN REAL DE GOOGLE CLOUD SPEECH-TO-TEXT ===
const initializeSpeechClient = () => {
    try {
        // Configuración de credenciales desde variables de entorno
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCLOUD_PROJECT || 'aiduxcare-mvp-prod';
        // Inicializar cliente con credenciales automáticas
        const speechClient = new speech_1.SpeechClient({
            projectId: projectId,
            // Las credenciales se cargan automáticamente desde:
            // 1. Variable de entorno GOOGLE_APPLICATION_CREDENTIALS
            // 2. Credenciales por defecto de Google Cloud
            // 3. Metadata service en Google Cloud Platform
        });
        console.log(`✅ SpeechClient inicializado para proyecto: ${projectId}`);
        return speechClient;
    }
    catch (error) {
        console.error('❌ Error inicializando SpeechClient:', error);
        throw new Error(`Error de configuración de Google Cloud Speech: ${error}`);
    }
};
// Inicializar cliente global
const speechClient = initializeSpeechClient();
// === CONFIGURACIÓN AVANZADA DE SPEECH-TO-TEXT ===
const createSpeechConfig = () => {
    return {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'es-ES',
        alternativeLanguageCodes: ['es-MX', 'es-AR', 'es-CL'],
        // === SPEAKER DIARIZATION CONFIGURATION ===
        diarizationConfig: {
            enableSpeakerDiarization: true,
            minSpeakerCount: 2,
            maxSpeakerCount: 4,
        },
        // === MEDICAL SPECIALIZATION ===
        model: 'medical_dictation',
        useEnhanced: true,
        // === ADVANCED FEATURES ===
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        enableAutomaticPunctuation: true,
        // === MEDICAL TERMINOLOGY BOOST ===
        speechContexts: [{
                phrases: [
                    // Anatomía
                    'cervical', 'lumbar', 'torácico', 'hombro', 'rodilla', 'cadera', 'muñeca', 'tobillo',
                    // Síntomas
                    'dolor', 'inflamación', 'rigidez', 'debilidad', 'entumecimiento', 'hormigueo',
                    // Tratamientos
                    'fisioterapia', 'ejercicio', 'estiramiento', 'fortalecimiento', 'movilización',
                    // Medicamentos
                    'ibuprofeno', 'paracetamol', 'diclofenaco', 'naproxeno', 'antiinflamatorio',
                    // Escalas de dolor
                    'escala del dolor', 'uno al diez', 'leve', 'moderado', 'severo', 'intenso'
                ],
                boost: 20.0
            }],
        // === PROFANITY FILTER ===
        profanityFilter: false, // Deshabilitado para contexto médico
    };
};
// === ANÁLISIS INTELIGENTE DE HABLANTES ===
const analyzeSpeakerRoles = (segments) => {
    const speakerStats = new Map();
    // Patrones para identificar roles
    const medicalTermsPattern = /\b(dolor|síntoma|tratamiento|ejercicio|terapia|medicamento|inflamación|rigidez)\b/gi;
    const questionPattern = /\?|cómo|qué|cuándo|dónde|por qué/gi;
    const instructionPattern = /\b(debe|tiene que|necesita|recomiendo|sugiero|haga|realice)\b/gi;
    // Analizar cada segmento
    segments.forEach(segment => {
        var _a;
        const speakerId = `speaker_${segment.speakerTag || 1}`;
        if (!speakerStats.has(speakerId)) {
            speakerStats.set(speakerId, {
                totalWords: 0,
                medicalTerms: 0,
                questionCount: 0,
                instructionCount: 0,
                segments: []
            });
        }
        const stats = speakerStats.get(speakerId);
        const text = ((_a = segment.alternatives[0]) === null || _a === void 0 ? void 0 : _a.transcript) || '';
        stats.totalWords += text.split(' ').length;
        stats.medicalTerms += (text.match(medicalTermsPattern) || []).length;
        stats.questionCount += (text.match(questionPattern) || []).length;
        stats.instructionCount += (text.match(instructionPattern) || []).length;
        stats.segments.push(segment);
    });
    // Determinar roles basado en patrones
    const speakers = [];
    speakerStats.forEach((stats, speakerId) => {
        let role = 'UNKNOWN';
        let confidence = 0.5;
        // Lógica de clasificación
        const medicalTermRatio = stats.medicalTerms / stats.totalWords;
        const instructionRatio = stats.instructionCount / stats.segments.length;
        const questionRatio = stats.questionCount / stats.segments.length;
        if (instructionRatio > 0.3 && medicalTermRatio > 0.1) {
            role = 'THERAPIST';
            confidence = Math.min(0.95, 0.6 + instructionRatio + medicalTermRatio);
        }
        else if (questionRatio > 0.2 || stats.totalWords < stats.segments.length * 5) {
            role = 'PATIENT';
            confidence = Math.min(0.9, 0.6 + questionRatio);
        }
        speakers.push({
            speakerId,
            role,
            confidence,
            totalWords: stats.totalWords
        });
    });
    return speakers;
};
// === PROCESAMIENTO PRINCIPAL ===
const processTranscription = async (req, res) => {
    const startTime = Date.now();
    try {
        console.log('🎤 Iniciando transcripción con Google Cloud Speech-to-Text...');
        // Validar datos de entrada
        const { audioData, sessionId } = req.body;
        if (!audioData) {
            res.status(400).json({
                success: false,
                error: 'Audio data es requerido'
            });
            return;
        }
        const currentSessionId = sessionId || (0, uuid_1.v4)();
        // Convertir audio base64 a buffer
        const audioBuffer = Buffer.from(audioData, 'base64');
        console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);
        // === LLAMADA REAL A GOOGLE CLOUD SPEECH-TO-TEXT ===
        const config = createSpeechConfig();
        const request = {
            config: config,
            audio: {
                content: audioBuffer.toString('base64')
            }
        };
        console.log('🔄 Enviando solicitud a Google Cloud Speech-to-Text...');
        const [response] = await speechClient.recognize(request);
        if (!response.results || response.results.length === 0) {
            console.log('⚠️ No se detectó audio o transcripción vacía');
            res.json({
                success: true,
                data: {
                    sessionId: currentSessionId,
                    segments: [],
                    speakers: [],
                    totalDuration: 0,
                    overallConfidence: 0,
                    processingTime: Date.now() - startTime
                }
            });
            return;
        }
        // === PROCESAMIENTO DE RESULTADOS ===
        const segments = [];
        let totalConfidence = 0;
        let totalDuration = 0;
        response.results.forEach((result, index) => {
            var _a;
            if (!result.alternatives || result.alternatives.length === 0)
                return;
            const alternative = result.alternatives[0];
            const transcript = alternative.transcript || '';
            const confidence = alternative.confidence || 0;
            // Extraer información de tiempo y palabras
            const words = ((_a = alternative.words) === null || _a === void 0 ? void 0 : _a.map((word) => {
                var _a, _b, _c, _d;
                return ({
                    word: word.word || '',
                    startTime: parseFloat(((_a = word.startTime) === null || _a === void 0 ? void 0 : _a.seconds) || '0') +
                        parseFloat(((_b = word.startTime) === null || _b === void 0 ? void 0 : _b.nanos) || '0') / 1e9,
                    endTime: parseFloat(((_c = word.endTime) === null || _c === void 0 ? void 0 : _c.seconds) || '0') +
                        parseFloat(((_d = word.endTime) === null || _d === void 0 ? void 0 : _d.nanos) || '0') / 1e9,
                    confidence: word.confidence || 0
                });
            })) || [];
            const startTime = words.length > 0 ? words[0].startTime : 0;
            const endTime = words.length > 0 ? words[words.length - 1].endTime : 0;
            totalDuration = Math.max(totalDuration, endTime);
            totalConfidence += confidence;
            // Información del hablante (de Speaker Diarization)
            const speakerTag = result.speakerTag || 1;
            const speakerInfo = {
                speakerId: `speaker_${speakerTag}`,
                role: 'UNKNOWN',
                confidence: 0.5,
                totalWords: words.length
            };
            segments.push({
                id: `segment_${currentSessionId}_${index}`,
                text: transcript,
                speaker: speakerInfo,
                startTime,
                endTime,
                confidence,
                words
            });
        });
        // === ANÁLISIS DE HABLANTES ===
        const speakers = analyzeSpeakerRoles(response.results);
        // Actualizar información de hablantes en segmentos
        segments.forEach(segment => {
            const speaker = speakers.find(s => s.speakerId === segment.speaker.speakerId);
            if (speaker) {
                segment.speaker = speaker;
            }
        });
        const result = {
            sessionId: currentSessionId,
            segments,
            speakers,
            totalDuration,
            overallConfidence: segments.length > 0 ? totalConfidence / segments.length : 0,
            processingTime: Date.now() - startTime
        };
        // === GUARDAR EN FIRESTORE ===
        const db = admin.firestore();
        await db.collection('transcriptions').doc(currentSessionId).set(Object.assign(Object.assign({}, result), { timestamp: admin.firestore.FieldValue.serverTimestamp(), status: 'completed' }));
        console.log(`✅ Transcripción completada en ${result.processingTime}ms`);
        console.log(`📊 Segmentos: ${segments.length}, Hablantes: ${speakers.length}`);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('❌ Error en transcripción:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando transcripción',
            details: error instanceof Error ? error.message : 'Error desconocido',
            processingTime: Date.now() - startTime
        });
    }
};
exports.processTranscription = processTranscription;
// === ENDPOINT DE ESTADO ===
const getTranscriptionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const db = admin.firestore();
        const doc = await db.collection('transcriptions').doc(sessionId).get();
        if (!doc.exists) {
            res.status(404).json({
                success: false,
                error: 'Sesión de transcripción no encontrada'
            });
            return;
        }
        res.json({
            success: true,
            data: doc.data()
        });
    }
    catch (error) {
        console.error('❌ Error obteniendo estado:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estado de transcripción'
        });
    }
};
exports.getTranscriptionStatus = getTranscriptionStatus;
//# sourceMappingURL=transcription.js.map