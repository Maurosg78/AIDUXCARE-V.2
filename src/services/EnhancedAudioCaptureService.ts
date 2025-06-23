/**
 * 🎙️ ENHANCED AUDIO CAPTURE SERVICE - VERSIÓN MEJORADA
 * 
 * Soluciona los problemas críticos identificados:
 * 1. ✅ Calidad de audio mejorada con configuración profesional
 * 2. ✅ Identificación inteligente de interlocutores
 * 3. ✅ Transcripción visible en tiempo real
 * 4. ✅ Preparado para integración con IA SOAP
 * 
 * @author AiDuxCare Team
 * @date Junio 2025
 * @version 2.0
 */

import { TranscriptionSegment, TranscriptionActor, TranscriptionConfidence } from '../core/audio/AudioCaptureService';

// === INTERFACES MEJORADAS ===

export interface EnhancedAudioConfig {
  language: 'es' | 'en';
  enableSpeakerDiarization: boolean;
  enableRealTimeDisplay: boolean;
  audioQuality: 'standard' | 'high' | 'professional';
  medicalContext: boolean;
  enableSmartPunctuation: boolean;
}

export interface SpeakerProfile {
  id: string;
  role: 'PATIENT' | 'THERAPIST' | 'UNKNOWN';
  confidence: number;
  voiceCharacteristics: {
    pitch: number;
    speed: number;
    volume: number;
  };
  keywordMatches: string[];
  lastActivity: number;
}

export interface RealTimeTranscriptionSegment {
  id: string;
  text: string;
  speaker: SpeakerProfile;
  confidence: number;
  timestamp: number;
  isInterim: boolean;
  isFinal: boolean;
  audioLevel: number;
  processingTime: number;
}

export interface AudioQualityMetrics {
  averageVolume: number;
  backgroundNoise: number;
  clarity: number;
  speakerSeparation: number;
  overallScore: number;
  recommendations: string[];
}

export interface EnhancedCaptureCallbacks {
  onRealTimeSegment: (segment: RealTimeTranscriptionSegment) => void;
  onSpeakerDetected: (speaker: SpeakerProfile) => void;
  onQualityUpdate: (metrics: AudioQualityMetrics) => void;
  onError: (error: string) => void;
  onStatusChange: (status: CaptureStatus) => void;
}

export type CaptureStatus = 'idle' | 'initializing' | 'recording' | 'processing' | 'error' | 'completed';

// === SERVICIO PRINCIPAL MEJORADO ===

export class EnhancedAudioCaptureService {
  private recognition: SpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private isCapturing: boolean = false;
  
  private config: EnhancedAudioConfig;
  private callbacks: EnhancedCaptureCallbacks;
  
  // Estados internos
  private speakers: Map<string, SpeakerProfile> = new Map();
  private currentSegments: RealTimeTranscriptionSegment[] = [];
  private qualityMetrics: AudioQualityMetrics;
  private sessionId: string = '';
  
  // Análisis de audio en tiempo real
  private audioAnalysisInterval: NodeJS.Timeout | null = null;
  private volumeHistory: number[] = [];
  private lastSpeechTime: number = 0;

  constructor(config: Partial<EnhancedAudioConfig> = {}, callbacks: EnhancedCaptureCallbacks) {
    this.config = {
      language: 'es',
      enableSpeakerDiarization: true,
      enableRealTimeDisplay: true,
      audioQuality: 'professional',
      medicalContext: true,
      enableSmartPunctuation: true,
      ...config
    };
    
    this.callbacks = callbacks;
    this.qualityMetrics = this.initializeQualityMetrics();
    
    this.initializeServices();
  }

  /**
   * Inicializar servicios de audio y reconocimiento
   */
  private async initializeServices(): Promise<void> {
    try {
      // Verificar soporte
      if (!this.isWebSpeechSupported()) {
        throw new Error('Web Speech API no soportada en este navegador');
      }

      // Inicializar Web Speech API con configuración profesional
      await this.setupEnhancedSpeechRecognition();
      
      // Inicializar análisis de audio
      await this.setupAudioAnalysis();
      
    } catch (error) {
      this.callbacks.onError(`Error inicializando servicios: ${error}`);
    }
  }

  /**
   * Configurar reconocimiento de voz con parámetros profesionales
   */
  private async setupEnhancedSpeechRecognition(): Promise<void> {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // CONFIGURACIÓN PROFESIONAL OPTIMIZADA
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.language === 'es' ? 'es-ES' : 'en-US';
    this.recognition.maxAlternatives = 3; // Múltiples alternativas para mejor precisión

    // Event handlers mejorados
    this.recognition.onstart = () => {
      this.callbacks.onStatusChange('recording');
    };

    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };

    this.recognition.onerror = (event) => {
      this.callbacks.onError(`Error de reconocimiento: ${event.error}`);
    };

    this.recognition.onend = () => {
      if (this.isCapturing) {
        // Reiniciar automáticamente para captura continua
        setTimeout(() => {
          if (this.isCapturing && this.recognition) {
            this.recognition.start();
          }
        }, 100);
      }
    };
  }

  /**
   * Configurar análisis de audio en tiempo real
   */
  private async setupAudioAnalysis(): Promise<void> {
    try {
      // Configuración de audio profesional
      const audioConstraints = this.getAudioConstraints();
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints
      });

      // Crear contexto de audio para análisis
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      // Configurar analizador
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Conectar stream al analizador
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

    } catch (error) {
      throw new Error(`Error configurando análisis de audio: ${error}`);
    }
  }

  /**
   * Obtener configuración de audio según calidad seleccionada
   */
  private getAudioConstraints(): MediaTrackConstraints {
    const baseConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    switch (this.config.audioQuality) {
      case 'professional':
        return {
          ...baseConstraints,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 2 },
          volume: { ideal: 1.0 },
          latency: { ideal: 0.01 }, // 10ms latencia
        };
      
      case 'high':
        return {
          ...baseConstraints,
          sampleRate: { ideal: 44100 },
          channelCount: { ideal: 1 },
        };
      
      default:
        return {
          ...baseConstraints,
          sampleRate: { ideal: 16000 },
        };
    }
  }

  /**
   * Iniciar captura mejorada
   */
  async startEnhancedCapture(): Promise<void> {
    if (this.isCapturing) {
      throw new Error('Ya hay una captura en curso');
    }

    try {
      this.callbacks.onStatusChange('initializing');
      this.sessionId = `enhanced_${Date.now()}`;
      
      // Limpiar estado previo
      this.speakers.clear();
      this.currentSegments = [];
      this.volumeHistory = [];
      
      // Iniciar análisis de calidad en tiempo real
      this.startQualityAnalysis();
      
      // Iniciar reconocimiento
      if (this.recognition) {
        this.recognition.start();
        this.isCapturing = true;
      }

    } catch (error) {
      this.callbacks.onError(`Error iniciando captura: ${error}`);
      throw error;
    }
  }

  /**
   * Manejar resultados de reconocimiento con identificación de interlocutores
   */
  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const now = Date.now();
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      
      // Identificar hablante inteligentemente
      const speaker = this.identifySmartSpeaker(transcript, confidence);
      
      // Crear segmento en tiempo real
      const segment: RealTimeTranscriptionSegment = {
        id: `segment_${now}_${i}`,
        text: transcript,
        speaker,
        confidence,
        timestamp: now,
        isInterim: !result.isFinal,
        isFinal: result.isFinal,
        audioLevel: this.getCurrentAudioLevel(),
        processingTime: now - this.lastSpeechTime
      };

      // Actualizar estado
      this.currentSegments.push(segment);
      this.lastSpeechTime = now;
      
      // Callback en tiempo real
      this.callbacks.onRealTimeSegment(segment);
      
      // Si es final, procesar para SOAP
      if (result.isFinal) {
        this.processForSOAPIntegration(segment);
      }
    }
  }

  /**
   * IDENTIFICACIÓN INTELIGENTE DE INTERLOCUTORES
   */
  private identifySmartSpeaker(text: string, confidence: number): SpeakerProfile {
    const speakerId = this.analyzeSpeakerCharacteristics(text);
    
    // Buscar hablante existente o crear nuevo
    let speaker = this.speakers.get(speakerId);
    
    if (!speaker) {
      speaker = this.createNewSpeakerProfile(speakerId, text);
      this.speakers.set(speakerId, speaker);
      this.callbacks.onSpeakerDetected(speaker);
    } else {
      // Actualizar perfil existente
      speaker = this.updateSpeakerProfile(speaker, text, confidence);
      this.speakers.set(speakerId, speaker);
    }
    
    return speaker;
  }

  /**
   * Analizar características del hablante
   */
  private analyzeSpeakerCharacteristics(text: string): string {
    const lowerText = text.toLowerCase().trim();
    
    // Patrones específicos para TERAPEUTA
    const therapistPatterns = [
      /vamos a (evaluar|examinar|revisar|trabajar)/,
      /necesito que (flexione|extienda|gire|levante)/,
      /observe (como|que|si)/,
      /recomiendo (que|hacer|continuar)/,
      /el tratamiento (consiste|incluye|será)/,
      /en la próxima sesión/,
      /según mi evaluación/,
      /diagnosis|protocolo|procedimiento/,
      /aplicaremos|realizaremos|trabajaremos/
    ];
    
    // Patrones específicos para PACIENTE  
    const patientPatterns = [
      /me duele (cuando|si|desde|mucho)/,
      /siento (que|como|dolor|molestia)/,
      /no puedo (hacer|mover|dormir|trabajar)/,
      /desde hace (días|semanas|meses)/,
      /en mi trabajo|en casa|cuando duermo/,
      /es difícil|me cuesta|me molesta/,
      /está mejor|está peor|sigue igual/,
      /antes podía|ahora no puedo/
    ];
    
    // Calcular puntuaciones
    const therapistScore = therapistPatterns.reduce((score, pattern) => 
      pattern.test(lowerText) ? score + 2 : score, 0
    );
    
    const patientScore = patientPatterns.reduce((score, pattern) => 
      pattern.test(lowerText) ? score + 2 : score, 0
    );
    
    // Análisis adicional por palabras clave
    const therapistKeywords = ['evaluar', 'examinar', 'tratamiento', 'recomiendo', 'protocolo', 'terapia'];
    const patientKeywords = ['duele', 'siento', 'molesta', 'difícil', 'trabajo', 'casa', 'dormir'];
    
    const therapistKeywordScore = therapistKeywords.reduce((score, keyword) => 
      lowerText.includes(keyword) ? score + 1 : score, 0
    );
    
    const patientKeywordScore = patientKeywords.reduce((score, keyword) => 
      lowerText.includes(keyword) ? score + 1 : score, 0
    );
    
    const finalTherapistScore = therapistScore + therapistKeywordScore;
    const finalPatientScore = patientScore + patientKeywordScore;
    
    // Decisión con umbral de confianza
    if (finalTherapistScore > finalPatientScore && finalTherapistScore >= 2) {
      return 'THERAPIST';
    } else if (finalPatientScore > finalTherapistScore && finalPatientScore >= 2) {
      return 'PATIENT';
    }
    
    // Si no hay claridad, usar contexto temporal
    return this.inferSpeakerFromContext();
  }

  /**
   * Inferir hablante desde contexto temporal
   */
  private inferSpeakerFromContext(): string {
    const recentSegments = this.currentSegments.slice(-3);
    
    if (recentSegments.length === 0) return 'PATIENT'; // Default inicial
    
    const lastSpeaker = recentSegments[recentSegments.length - 1]?.speaker?.role;
    
    // Alternar hablantes si no hay indicios claros
    return lastSpeaker === 'PATIENT' ? 'THERAPIST' : 'PATIENT';
  }

  /**
   * Crear nuevo perfil de hablante
   */
  private createNewSpeakerProfile(speakerId: string, text: string): SpeakerProfile {
    return {
      id: speakerId,
      role: speakerId as 'PATIENT' | 'THERAPIST',
      confidence: 0.8,
      voiceCharacteristics: {
        pitch: this.estimatePitch(),
        speed: this.estimateSpeed(text),
        volume: this.getCurrentAudioLevel()
      },
      keywordMatches: this.extractKeywords(text),
      lastActivity: Date.now()
    };
  }

  /**
   * Actualizar perfil de hablante existente
   */
  private updateSpeakerProfile(speaker: SpeakerProfile, text: string, confidence: number): SpeakerProfile {
    return {
      ...speaker,
      confidence: (speaker.confidence + confidence) / 2,
      keywordMatches: [...speaker.keywordMatches, ...this.extractKeywords(text)].slice(-10),
      lastActivity: Date.now()
    };
  }

  /**
   * Extraer palabras clave del texto
   */
  private extractKeywords(text: string): string[] {
    const medicalKeywords = [
      'dolor', 'molestia', 'tratamiento', 'terapia', 'ejercicio', 
      'rehabilitación', 'evaluación', 'diagnóstico', 'síntoma',
      'flexión', 'extensión', 'movilidad', 'fuerza', 'postura'
    ];
    
    return medicalKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Iniciar análisis de calidad en tiempo real
   */
  private startQualityAnalysis(): void {
    this.audioAnalysisInterval = setInterval(() => {
      this.updateQualityMetrics();
    }, 1000); // Actualizar cada segundo
  }

  /**
   * Actualizar métricas de calidad
   */
  private updateQualityMetrics(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calcular volumen promedio
    const averageVolume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    this.volumeHistory.push(averageVolume);
    
    // Mantener solo últimos 30 segundos
    if (this.volumeHistory.length > 30) {
      this.volumeHistory.shift();
    }

    // Calcular métricas
    const backgroundNoise = Math.min(...this.volumeHistory);
    const maxVolume = Math.max(...this.volumeHistory);
    const clarity = maxVolume > 0 ? (maxVolume - backgroundNoise) / maxVolume : 0;
    
    this.qualityMetrics = {
      averageVolume: averageVolume / 255,
      backgroundNoise: backgroundNoise / 255,
      clarity,
      speakerSeparation: this.calculateSpeakerSeparation(),
      overallScore: this.calculateOverallScore(clarity, averageVolume / 255),
      recommendations: this.generateRecommendations(clarity, averageVolume / 255)
    };

    this.callbacks.onQualityUpdate(this.qualityMetrics);
  }

  /**
   * Calcular separación entre hablantes
   */
  private calculateSpeakerSeparation(): number {
    if (this.speakers.size < 2) return 1.0;
    
    // Análisis simplificado basado en actividad temporal
    const speakers = Array.from(this.speakers.values());
    const timeDifferences = speakers.map(s => Date.now() - s.lastActivity);
    const maxDiff = Math.max(...timeDifferences);
    const minDiff = Math.min(...timeDifferences);
    
    return maxDiff > 0 ? (maxDiff - minDiff) / maxDiff : 0.5;
  }

  /**
   * Calcular puntuación general de calidad
   */
  private calculateOverallScore(clarity: number, volume: number): number {
    const clarityWeight = 0.4;
    const volumeWeight = 0.3;
    const separationWeight = 0.3;
    
    const volumeScore = Math.min(volume * 2, 1); // Penalizar volumen muy bajo
    const separationScore = this.calculateSpeakerSeparation();
    
    return (clarity * clarityWeight) + (volumeScore * volumeWeight) + (separationScore * separationWeight);
  }

  /**
   * Generar recomendaciones de mejora
   */
  private generateRecommendations(clarity: number, volume: number): string[] {
    const recommendations: string[] = [];
    
    if (volume < 0.3) {
      recommendations.push('📢 Habla más cerca del micrófono');
    }
    
    if (clarity < 0.5) {
      recommendations.push('🔇 Reduce el ruido de fondo');
    }
    
    if (this.qualityMetrics.backgroundNoise > 0.2) {
      recommendations.push('🏠 Busca un lugar más silencioso');
    }
    
    if (this.speakers.size < 2 && Date.now() - this.lastSpeechTime > 10000) {
      recommendations.push('👥 Asegúrate de que ambos interlocutores hablen');
    }
    
    return recommendations;
  }

  /**
   * Procesar segmento para integración SOAP
   */
  private processForSOAPIntegration(segment: RealTimeTranscriptionSegment): void {
    // Aquí se integrará con el SOAPClassifierV2Service
    // Por ahora, preparamos los datos
    const soapReadySegment = {
      id: segment.id,
      text: segment.text,
      speaker: segment.speaker.role,
      confidence: segment.confidence,
      timestamp: segment.timestamp,
      medical_entities: this.extractMedicalEntities(segment.text),
      soap_hints: this.generateSOAPHints(segment.text, segment.speaker.role)
    };
    
    // TODO: Integrar con SOAPClassifierV2Service
    console.log('📋 Segmento listo para clasificación SOAP:', soapReadySegment);
  }

  /**
   * Extraer entidades médicas básicas
   */
  private extractMedicalEntities(text: string): any[] {
    const entities = [];
    const lowerText = text.toLowerCase();
    
    // Patrones básicos de entidades médicas
    const patterns = {
      dolor: /dolor (en|de) (la|el) (\w+)/g,
      medicamento: /(ibuprofeno|paracetamol|diclofenaco|naproxeno)/g,
      anatomia: /(espalda|cuello|hombro|rodilla|tobillo|muñeca|cadera)/g,
      sintoma: /(inflamación|hinchazón|rigidez|debilidad|entumecimiento)/g
    };
    
    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = lowerText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            text: match,
            type,
            confidence: 0.8,
            start: text.toLowerCase().indexOf(match),
            end: text.toLowerCase().indexOf(match) + match.length
          });
        });
      }
    });
    
    return entities;
  }

  /**
   * Generar pistas para clasificación SOAP
   */
  private generateSOAPHints(text: string, speakerRole: string): any {
    const lowerText = text.toLowerCase();
    
    if (speakerRole === 'PATIENT') {
      if (/me duele|siento|molesta/.test(lowerText)) {
        return { suggested_section: 'S', confidence: 0.9, reason: 'Síntoma reportado por paciente' };
      }
    } else if (speakerRole === 'THERAPIST') {
      if (/evaluar|examinar|observar/.test(lowerText)) {
        return { suggested_section: 'O', confidence: 0.9, reason: 'Examen físico por terapeuta' };
      }
      if (/diagnóstico|evaluación|impresión/.test(lowerText)) {
        return { suggested_section: 'A', confidence: 0.9, reason: 'Evaluación profesional' };
      }
      if (/tratamiento|plan|recomiendo/.test(lowerText)) {
        return { suggested_section: 'P', confidence: 0.9, reason: 'Plan de tratamiento' };
      }
    }
    
    return { suggested_section: 'S', confidence: 0.5, reason: 'Clasificación por defecto' };
  }

  /**
   * Métodos auxiliares para análisis de audio
   */
  private getCurrentAudioLevel(): number {
    if (!this.analyser) return 0;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = (dataArray[i] - 128) / 128;
      sum += sample * sample;
    }
    
    return Math.sqrt(sum / bufferLength);
  }

  private estimatePitch(): number {
    // Estimación simplificada - en producción usaríamos algoritmos más sofisticados
    return Math.random() * 200 + 100; // 100-300 Hz
  }

  private estimateSpeed(text: string): number {
    // Palabras por minuto estimadas
    const words = text.split(' ').length;
    const timeWindow = 10; // segundos
    return (words / timeWindow) * 60;
  }

  /**
   * Detener captura
   */
  async stopCapture(): Promise<RealTimeTranscriptionSegment[]> {
    this.isCapturing = false;
    
    if (this.recognition) {
      this.recognition.stop();
    }
    
    if (this.audioAnalysisInterval) {
      clearInterval(this.audioAnalysisInterval);
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
    }
    
    this.callbacks.onStatusChange('completed');
    
    return this.currentSegments.filter(s => s.isFinal);
  }

  /**
   * Obtener métricas actuales
   */
  getCurrentMetrics(): {
    segments: number;
    speakers: number;
    quality: AudioQualityMetrics;
    duration: number;
  } {
    return {
      segments: this.currentSegments.length,
      speakers: this.speakers.size,
      quality: this.qualityMetrics,
      duration: Date.now() - (this.currentSegments[0]?.timestamp || Date.now())
    };
  }

  /**
   * Verificar soporte
   */
  private isWebSpeechSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Inicializar métricas de calidad
   */
  private initializeQualityMetrics(): AudioQualityMetrics {
    return {
      averageVolume: 0,
      backgroundNoise: 0,
      clarity: 0,
      speakerSeparation: 0,
      overallScore: 0,
      recommendations: []
    };
  }
}

// === DECLARACIONES GLOBALES ===
declare global {
  interface Window {
    SpeechRecognition: new() => SpeechRecognition;
    webkitSpeechRecognition: new() => SpeechRecognition;
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export default EnhancedAudioCaptureService; 