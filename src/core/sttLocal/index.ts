// @ts-nocheck
import { LocalTranscription } from '../../stores/aiModeStore';

import logger from '@/shared/utils/logger';

export interface STTLocalConfig {
  model: 'whisper-tiny' | 'vosk-small' | 'fallback';
  enableSIMD: boolean;
  enableWebGPU: boolean;
  maxAudioDuration: number; // segundos
  confidenceThreshold: number;
}

export interface STTLocalResult {
  text: string;
  confidence: number;
  processingTime: number;
  model: string;
  fallback: boolean;
}

export interface STTLocalCapabilities {
  wasmSupported: boolean;
  simdSupported: boolean;
  webGPUSupported: boolean;
  modelsAvailable: string[];
  maxAudioLength: number;
}

// Configuración por defecto
const DEFAULT_CONFIG: STTLocalConfig = {
  model: 'fallback',
  enableSIMD: false,
  enableWebGPU: false,
  maxAudioDuration: 300, // 5 minutos
  confidenceThreshold: 0.7
};

// Detectar capacidades del navegador
export function detectSTTCapabilities(): STTLocalCapabilities {
  const wasmSupported = typeof WebAssembly !== 'undefined';
  const simdSupported = wasmSupported && WebAssembly.validate(new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));
  const webGPUSupported = 'gpu' in navigator;
  
  const modelsAvailable = wasmSupported ? ['whisper-tiny', 'vosk-small'] : ['fallback'];
  
  return {
    wasmSupported,
    simdSupported,
    webGPUSupported,
    modelsAvailable,
    maxAudioLength: wasmSupported ? 300 : 60 // 5 min con WASM, 1 min sin
  };
}

// Clase principal de STT Local
export class STTLocalEngine {
  public async getAudioInfo(blob: Blob): Promise<{ duration: number; sampleRate: number; channels: number }> {
    // llama al método privado existente
    return (this as any).validateAudio(blob);
  }
  private config: STTLocalConfig;
  private capabilities: STTLocalCapabilities;
  private isInitialized: boolean = false;
  private currentModel: string | null = null;

  constructor(config: Partial<STTLocalConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.capabilities = detectSTTCapabilities();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if (!this.capabilities.wasmSupported) {
        console.warn('STT Local: WebAssembly no soportado, usando modo fallback');
        this.currentModel = 'fallback';
        this.isInitialized = true;
        return;
      }

      // Intentar cargar el modelo preferido
      if (this.config.model !== 'fallback' && this.capabilities.modelsAvailable.includes(this.config.model)) {
        await this.loadModel(this.config.model);
      } else {
        this.currentModel = 'fallback';
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('STT Local: Error en inicialización:', error);
      this.currentModel = 'fallback';
      this.isInitialized = true;
    }
  }

  private async loadModel(modelName: string): Promise<void> {
    // Placeholder para carga de modelos WASM
    // En implementación real, aquí se cargarían los archivos .wasm
    console.log(`STT Local: Cargando modelo ${modelName}`);
    
    // Simular carga
    await new Promise(resolve => setTimeout(resolve, 100));
    this.currentModel = modelName;
  }

  // Método principal de transcripción
  async transcribeLocal(audioBlob: Blob): Promise<STTLocalResult> {
    if (!this.isInitialized) {
      throw new Error('STT Local: Motor no inicializado');
    }

    const startTime = performance.now();
    
    try {
      // Validar audio
      const audioInfo = await this.validateAudio(audioBlob);
      
      if (audioInfo.duration > this.config.maxAudioDuration) {
        throw new Error(`Audio demasiado largo: ${audioInfo.duration}s > ${this.config.maxAudioDuration}s`);
      }

      let result: STTLocalResult;

      if (this.currentModel === 'fallback') {
        result = await this.fallbackTranscription(audioBlob);
      } else {
        result = await this.wasmTranscription(audioBlob);
      }

      result.processingTime = performance.now() - startTime;
      return result;

    } catch (error) {
      console.error('STT Local: Error en transcripción:', error);
      // Fallback a captura sin transcripción
      return {
        text: '[Audio capturado - transcripción fallida]',
        confidence: 0.0,
        processingTime: performance.now() - startTime,
        model: 'fallback',
        fallback: true
      };
    }
  }

  private async validateAudio(audioBlob: Blob): Promise<{ duration: number; sampleRate: number; channels: number }> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(audioBlob);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        return {
          duration: audio.duration,
          sampleRate: 44100, // Valor por defecto
          channels: 1 // Mono por defecto
        };
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo validar el audio'));
      };
      
      audio.src = url;
    });
  }

  private async wasmTranscription(_audioBlob: Blob): Promise<STTLocalResult> {
    // Placeholder para transcripción WASM real
    // En implementación real, aquí se procesaría con el modelo cargado
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      text: '[Transcripción WASM - placeholder]',
      confidence: 0.85,
      processingTime: 0,
      model: this.currentModel || 'unknown',
      fallback: false
    };
  }

  private async fallbackTranscription(_audioBlob: Blob): Promise<STTLocalResult> {
    // Modo fallback: solo captura el audio
    return {
      text: '[Audio capturado - modo offline]',
      confidence: 0.0,
      processingTime: 0,
      model: 'fallback',
      fallback: true
    };
  }

  // Métodos de utilidad
  getCapabilities(): STTLocalCapabilities {
    return { ...this.capabilities };
  }

  getConfig(): STTLocalConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<STTLocalConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Instancia singleton para uso global
export const sttLocalEngine = new STTLocalEngine();

// Función de conveniencia para uso directo
export async function transcribeLocal(audioBlob: Blob): Promise<STTLocalResult> {
  return sttLocalEngine.transcribeLocal(audioBlob);
}

// Función para crear transcripción local
export async function createLocalTranscription(
  audioBlob: Blob,
  userId: string,
  sessionId: string
): Promise<LocalTranscription> {
  const audioInfo = await sttLocalEngine.getAudioInfo(audioBlob);
  const result = await transcribeLocal(audioBlob);

  const transcription: LocalTranscription = {
    id: crypto.randomUUID(),
    audioBlob: result.fallback ? undefined : audioBlob,
    text: result.text,
    confidence: result.confidence,
    timestamp: new Date(),
    userId,
    sessionId,
    metadata: {
      duration: audioInfo.duration,
      sampleRate: audioInfo.sampleRate,
      channels: audioInfo.channels,
    },
  };

  return transcription;
}