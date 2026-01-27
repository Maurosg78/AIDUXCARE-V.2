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

    // ✅ FIX-2: Enhanced validation for empty transcript
    if (!text || text.length < 5) {
      const errorMsg = !text
        ? "No se recibió texto transcrito desde Whisper. El audio puede estar vacío o ser inaudible."
        : `Transcripción muy corta (${text.length} caracteres). Por favor, grabe hablando más claramente durante al menos 3 segundos.`;
      console.error('[Whisper] Empty or very short transcript:', { textLength: text?.length || 0, text });
      throw new Error(errorMsg);
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

    // ✅ PILOT VALIDATIONS: Audio size checks (FIX-1 + existing)
    const MAX_FILE_SIZE_MB = 25; // 25MB limit
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    const MIN_FILE_SIZE_KB = 10; // 10KB minimum (roughly 2-3 seconds of audio)
    const MIN_FILE_SIZE_BYTES = MIN_FILE_SIZE_KB * 1024;
    const fileSizeMB = audioBlob.size / (1024 * 1024);
    const fileSizeKB = audioBlob.size / 1024;

    // ✅ FIX-1: Validate audio is not too small (pilot-level validation)
    if (audioBlob.size < MIN_FILE_SIZE_BYTES) {
      const errorMessage = `El audio es demasiado corto (${fileSizeKB.toFixed(1)} KB). Por favor, grabe durante al menos 3 segundos hablando claramente.`;
      console.error('[Whisper] Audio too small:', fileSizeKB.toFixed(1), 'KB, minimum:', MIN_FILE_SIZE_KB, 'KB');
      throw new Error(errorMessage);
    }

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
        fileSizeKB: fileSizeKB.toFixed(1),
        fileSizeBytes: audioBlob.size,
        timeoutSeconds: TIMEOUT_MS / 1000,
        mimeType: audioBlob.type,
        languageHint: options?.languageHint || 'auto',
        mode: options?.mode || 'live',
        timestamp: new Date().toISOString()
      });

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

        // ✅ FIX-3: Enhanced error logging with specific error types
        console.error("[Whisper] ❌ API error:", {
          status: response.status,
          statusText: response.statusText,
          fileSizeMB: fileSizeMB.toFixed(2),
          fileSizeKB: fileSizeKB.toFixed(1),
          mimeType: audioBlob.type,
          requestTimeMs: requestTime.toFixed(0),
          errorBody: errorBody.substring(0, 500), // Limit log size
          timestamp: new Date().toISOString()
        });

        // ✅ FIX-3: User-friendly error messages with specific error types
        let errorMessage = "Servicio de transcripción temporalmente no disponible";
        let errorType = "UNKNOWN_ERROR";

        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.error?.message) {
            const apiMessage = errorJson.error.message;
            const lowerMessage = apiMessage.toLowerCase();

            // ✅ FIX-3: Specific error type classification
            if (lowerMessage.includes('mime') || lowerMessage.includes('format') || lowerMessage.includes('unsupported')) {
              errorType = "AUDIO_FORMAT_UNSUPPORTED";
              errorMessage = `Formato de audio no soportado. Tipo detectado: ${audioBlob.type || 'desconocido'}. Por favor, intente grabar nuevamente.`;
            } else if (lowerMessage.includes('corrupted') || lowerMessage.includes('corrupt')) {
              errorType = "AUDIO_CORRUPTED";
              errorMessage = `El archivo de audio está corrupto (${fileSizeKB.toFixed(1)} KB). Por favor, grabe nuevamente hablando más cerca del micrófono.`;
            } else if (lowerMessage.includes('too small') || lowerMessage.includes('too short') || lowerMessage.includes('minimum')) {
              errorType = "AUDIO_TOO_SHORT";
              errorMessage = `El audio es muy corto (${fileSizeKB.toFixed(1)} KB). Por favor, grabe durante al menos 3 segundos.`;
            } else if (lowerMessage.includes('invalid') || lowerMessage.includes('malformed')) {
              errorType = "AUDIO_INVALID";
              errorMessage = `El formato de audio no es válido. Por favor, intente grabar nuevamente.`;
            } else if (response.status === 429) {
              errorType = "RATE_LIMIT";
              errorMessage = "Demasiadas solicitudes. Por favor, espere un momento e intente nuevamente.";
            } else if (response.status >= 500) {
              errorType = "SERVICE_ERROR";
              errorMessage = "El servicio de transcripción está temporalmente no disponible. Por favor, intente en unos momentos.";
            } else {
              // Keep original API message for unexpected errors
              errorMessage = apiMessage;
            }
          }
        } catch {
          // If parsing fails, use default message
          errorType = "PARSE_ERROR";
        }

        console.error(`[Whisper] Error type: ${errorType}`);
        throw new Error(errorMessage);
      }

      const transcription = (await response.json()) as WhisperTranscriptionResponse;
      if (transcription.error) {
        console.error('[Whisper] API returned error in response:', transcription.error);
        throw new Error(transcription.error.message || "Error en respuesta de Whisper");
      }

      // ✅ FIX-2: mapResponse now validates transcript is not empty
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
        fileSizeKB: fileSizeKB.toFixed(1),
        requestTimeMs: totalRequestTime.toFixed(0),
        requestTimeSeconds: (totalRequestTime / 1000).toFixed(2),
        timestamp: new Date().toISOString()
      });

      return mapped;

    } catch (error) {
      console.error("[Whisper] Error interno en servicio de transcripción:", error);

      // ✅ FIX-3: Specific error handling with error types
      if (error instanceof Error) {
        // Handle timeout/abort
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          const errorType = "TRANSCRIPTION_TIMEOUT";
          console.error(`[Whisper] Error type: ${errorType}`);
          throw new Error(`La transcripción está tomando demasiado tiempo (más de 5 minutos). El archivo puede ser muy largo (${fileSizeMB.toFixed(2)} MB). Por favor, intente dividir la grabación en segmentos más cortos.`);
        }

        // Handle network errors
        if (error.message.includes('network') || error.message.includes('fetch')) {
          const errorType = "NETWORK_ERROR";
          console.error(`[Whisper] Error type: ${errorType}`);
          throw new Error("Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.");
        }

        // Re-throw specific errors from validation or mapResponse
        throw error;
      }

      // Unknown error
      const errorType = "UNKNOWN_ERROR";
      console.error(`[Whisper] Error type: ${errorType}`);
      throw new Error("Error procesando el audio. Por favor intente nuevamente.");
    }
  }
}