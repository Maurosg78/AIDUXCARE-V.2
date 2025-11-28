// src/services/OpenAIWhisperService.ts

import { OPENAI_API_KEY, WHISPER_MODEL, OPENAI_TRANSCRIPT_URL } from "../config/env";

export type WhisperSupportedLanguage = "auto" | "en" | "es" | "fr";
export type WhisperMode = "live" | "dictation";

export interface WhisperTranscriptionOptions {
  languageHint?: WhisperSupportedLanguage;
  mode?: WhisperMode;
  promptOverride?: string;
}

export interface WhisperTranscriptionResult {
  text: string;
  detectedLanguage: string | null;
  durationSeconds?: number;
  averageLogProb?: number | null;
}

type WhisperTranscriptionResponse = {
  text?: string;
  language?: string;
  duration?: number;
  segments?: Array<{ avg_logprob?: number | null }>;
  error?: {
    message?: string;
    type?: string;
    param?: string | null;
    code?: string | null;
  };
};

export class OpenAIWhisperService {
  private static readonly API_KEY = OPENAI_API_KEY;
  private static readonly API_URL = OPENAI_TRANSCRIPT_URL || "https://api.openai.com/v1/audio/transcriptions";
  private static readonly DEFAULT_MODEL = WHISPER_MODEL || "gpt-4o-mini-transcribe";
  private static readonly ALLOWED_LANGUAGES: WhisperSupportedLanguage[] = ["auto", "en", "es", "fr"];

  private static ensureConfigured() {
    if (!this.API_KEY) {
      console.error("OpenAI API key no configurada");
      throw new Error("Servicio de transcripción no configurado. Contacte al administrador.");
    }
  }

  private static sanitizeLanguageHint(languageHint?: WhisperSupportedLanguage): WhisperSupportedLanguage {
    if (!languageHint) {
      return "auto";
    }
    return this.ALLOWED_LANGUAGES.includes(languageHint) ? languageHint : "auto";
  }

  private static buildClinicalPrompt(mode: WhisperMode = "live", promptOverride?: string): string {
    if (promptOverride?.trim()) {
      return promptOverride.trim();
    }

    const baseLines = [
      "Clinical context: Canadian physiotherapy assessment in compliance with PHIPA/PIPEDA.",
      "Vocabulary bias: AiDuxCare, Niagara, physiotherapy, manual therapy, gait, cervical spine, lumbar spine, vestibular assessment, thoracic outlet syndrome, WSIB, PHIPA, PIPEDA, SOAP, patient safety, mobility training, documentation, discharge planning.",
      "Respect Canadian English, Canadian French, and Latin American Spanish accents.",
      "Do not fabricate patient identifiers or personal health information."
    ];

    if (mode === "dictation") {
      baseLines.push("Mode: Post-session dictation with longer uninterrupted speech; prioritise completeness over latency.");
    } else {
      baseLines.push("Mode: Live clinical conversation with back-and-forth dialogue; prioritise timely segmentation without losing context.");
    }

    return baseLines.join("\n");
  }

  /**
   * Maps MIME type to Whisper-compatible file extension
   * Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
   */
  private static getWhisperCompatibleFilename(mimeType: string): string {
    // ✅ SPRINT 2 P3: Normalize MIME type first to fix malformed types
    let normalizedMime = mimeType
      .replace(/\/+/g, '/') // Fix multiple slashes (//, ///, etc.)
      .replace(/webrm/gi, 'webm') // Fix typo: webrm -> webm
      .trim();
    
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/webm;codecs=opus': 'webm',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/mpeg3': 'mp3',
      'audio/x-mpeg-3': 'mp3',
      'audio/mpga': 'mpga',
      'audio/m4a': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/x-wav': 'wav',
      'audio/aac': 'm4a', // AAC is typically in MP4/M4A container
      'audio/aacp': 'm4a',
      'audio/ogg': 'webm', // Fallback: OGG to webm
    };

    // Remove parameters like codecs for lookup
    const baseMime = normalizedMime.split(';')[0].toLowerCase().trim();
    const extension = mimeToExt[baseMime] || mimeToExt[baseMime.split('/')[1]] || 'webm';
    
    console.log(`[Whisper] Normalized MIME: "${mimeType}" -> "${normalizedMime}" -> "${baseMime}" -> extension: "${extension}"`);
    
    return `clinical-audio.${extension}`;
  }

  private static buildFormData(audioBlob: Blob, options?: WhisperTranscriptionOptions): FormData {
    const formData = new FormData();
    
    // ✅ SPRINT 2 P3: Detect and normalize MIME type from blob
    let mimeType = audioBlob.type || 'audio/webm';
    
    // Normalize MIME type to fix common issues
    mimeType = mimeType
      .replace(/\/+/g, '/') // Fix multiple slashes (//, ///, etc.)
      .replace(/webrm/gi, 'webm') // Fix typo: webrm -> webm
      .trim();
    
    const filename = this.getWhisperCompatibleFilename(mimeType);
    
    console.log(`[Whisper] Audio MIME type: "${audioBlob.type}" -> normalized: "${mimeType}", using filename: ${filename}`);
    
    formData.append("file", audioBlob, filename);
    formData.append("model", this.DEFAULT_MODEL);
    formData.append("response_format", "json");
    formData.append("temperature", "0");
    formData.append("log_probabilities", "true");

    const languageHint = this.sanitizeLanguageHint(options?.languageHint);
    if (languageHint !== "auto") {
      formData.append("language", languageHint);
    }

    if (options?.promptOverride?.trim()) {
      formData.append("prompt", options.promptOverride.trim());
    }

    return formData;
  }

  private static mapResponse(data: WhisperTranscriptionResponse): WhisperTranscriptionResult {
    const text = data.text?.trim();
    if (!text) {
      throw new Error("No se recibió texto transcrito desde Whisper");
    }

    const language = typeof data.language === "string" ? data.language : null;
    const durationSeconds = typeof data.duration === "number" ? data.duration : undefined;

    let averageLogProb: number | null = null;
    if (Array.isArray(data.segments) && data.segments.length > 0) {
      const logprobs = data.segments
        .map((segment) => (typeof segment?.avg_logprob === "number" ? segment.avg_logprob : null))
        .filter((value): value is number => value !== null);
      if (logprobs.length > 0) {
        averageLogProb = logprobs.reduce((sum, value) => sum + value, 0) / logprobs.length;
      }
    }

    return {
      text,
      detectedLanguage: language,
      durationSeconds,
      averageLogProb
    };
  }

  static async transcribe(audioBlob: Blob, options?: WhisperTranscriptionOptions): Promise<WhisperTranscriptionResult> {
    this.ensureConfigured();

    // ✅ SPRINT 2 P3: Validate audio size before processing
    // Whisper API has practical limits: ~25MB file size, ~10 minutes duration
    const MAX_FILE_SIZE_MB = 25; // 25MB limit
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const fileSizeMB = audioBlob.size / (1024 * 1024);
    const audioFileSizeMB = fileSizeMB; // Store for error handling
    
    if (audioBlob.size > MAX_FILE_SIZE_BYTES) {
      const errorMessage = `El archivo de audio es muy grande (${fileSizeMB.toFixed(2)} MB). El límite máximo es ${MAX_FILE_SIZE_MB} MB. Por favor, divida la grabación en segmentos más cortos.`;
      console.error('[Whisper] File too large:', fileSizeMB.toFixed(2), 'MB');
      throw new Error(errorMessage);
    }

    try {
      const formData = this.buildFormData(audioBlob, options);

      // ✅ SPRINT 2 P3: Add timeout for long transcriptions
      // For 10-minute audio, allow up to 5 minutes processing time
      const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, TIMEOUT_MS);

      // ✅ PHASE 1: Enhanced logging for Whisper API request
      const requestStartTime = performance.now();
      console.log(`[Whisper] 🚀 Starting transcription:`, {
        fileSizeMB: fileSizeMB.toFixed(2),
        fileSizeBytes: audioBlob.size,
        timeoutSeconds: TIMEOUT_MS / 1000,
        mimeType: audioBlob.type,
        languageHint: options?.languageHint || 'auto',
        mode: options?.mode || 'live',
        timestamp: new Date().toISOString()
      });
      console.log(`[Whisper] Starting transcription: ${fileSizeMB.toFixed(2)} MB, timeout: ${TIMEOUT_MS / 1000}s`);

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.API_KEY}`
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const requestTime = performance.now() - requestStartTime;

      if (!response.ok) {
        const errorBody = await response.text();
        
        // ✅ PHASE 1: Enhanced logging for Whisper API errors
        console.error("[Whisper] ❌ API error:", {
          status: response.status,
          statusText: response.statusText,
          fileSizeMB: fileSizeMB.toFixed(2),
          mimeType: audioBlob.type,
          requestTimeMs: requestTime.toFixed(0),
          errorBody: errorBody.substring(0, 500), // Limit log size
          timestamp: new Date().toISOString()
        });
        
        console.error("Whisper API error:", response.status, errorBody);
        console.error("Audio blob details:", {
          size: audioBlob.size,
          type: audioBlob.type,
          sizeKB: (audioBlob.size / 1024).toFixed(2)
        });
        
        // Try to parse error message from response
        let errorMessage = "Servicio de transcripción temporalmente no disponible";
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
            
            // ✅ SPRINT 2 P3: Provide user-friendly messages for common errors
            const lowerMessage = errorMessage.toLowerCase();
            
            if (lowerMessage.includes('mime') || lowerMessage.includes('format') || lowerMessage.includes('unsupported')) {
              errorMessage = `Formato de audio no soportado. Tipo detectado: ${audioBlob.type || 'desconocido'}. Por favor, intente grabar nuevamente.`;
            } else if (lowerMessage.includes('corrupted') || lowerMessage.includes('corrupt')) {
              errorMessage = `El archivo de audio está corrupto o es muy pequeño (${(audioBlob.size / 1024).toFixed(2)} KB). Por favor, grabe nuevamente hablando más cerca del micrófono.`;
            } else if (lowerMessage.includes('too small') || lowerMessage.includes('too short')) {
              errorMessage = `El audio es muy corto (${(audioBlob.size / 1024).toFixed(2)} KB). Por favor, grabe durante al menos 3 segundos.`;
            } else if (lowerMessage.includes('invalid') || lowerMessage.includes('malformed')) {
              errorMessage = `El formato de audio no es válido. Por favor, intente grabar nuevamente.`;
            }
          }
        } catch {
          // If parsing fails, use default message
        }
        
        throw new Error(errorMessage);
      }

      const transcription = (await response.json()) as WhisperTranscriptionResponse;
      if (transcription.error) {
        throw new Error(transcription.error.message || "Error en respuesta de Whisper");
      }

      const mapped = this.mapResponse(transcription);
      const totalRequestTime = performance.now() - requestStartTime;
      
      // ✅ PHASE 1: Enhanced logging for successful transcription
      console.log("[Whisper] ✅ Transcription completed:", {
        textLength: mapped.text.length,
        characters: mapped.text.length,
        preview: mapped.text.slice(0, 80),
        detectedLanguage: mapped.detectedLanguage,
        durationSeconds: mapped.durationSeconds,
        averageLogProb: mapped.averageLogProb,
        fileSizeMB: fileSizeMB.toFixed(2),
        requestTimeMs: totalRequestTime.toFixed(0),
        requestTimeSeconds: (totalRequestTime / 1000).toFixed(2),
        timestamp: new Date().toISOString()
      });
      
      console.log("Transcripción completada:", mapped.text.length, "caracteres", {
        preview: mapped.text.slice(0, 80),
        detectedLanguage: mapped.detectedLanguage,
        durationSeconds: mapped.durationSeconds,
        averageLogProb: mapped.averageLogProb
      });
      return mapped;
    } catch (error) {
      console.error("Error interno en servicio de transcripción:", error);
      
      // ✅ SPRINT 2 P3: Handle timeout and abort errors specifically
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          throw new Error(`La transcripción está tomando demasiado tiempo (más de 5 minutos). El archivo puede ser muy largo (${audioFileSizeMB.toFixed(2)} MB). Por favor, intente dividir la grabación en segmentos más cortos o grabe nuevamente.`);
        }
        throw error;
      }
      throw new Error("Error procesando el audio. Por favor intente nuevamente.");
    }
  }
}
