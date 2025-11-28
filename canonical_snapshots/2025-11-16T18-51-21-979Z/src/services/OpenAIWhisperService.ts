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

  private static buildFormData(audioBlob: Blob, options?: WhisperTranscriptionOptions): FormData {
    const formData = new FormData();
    formData.append("file", audioBlob, "clinical-audio.webm");
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

    try {
      const formData = this.buildFormData(audioBlob, options);

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Whisper API error:", response.status, errorBody);
        throw new Error("Servicio de transcripción temporalmente no disponible");
      }

      const transcription = (await response.json()) as WhisperTranscriptionResponse;
      if (transcription.error) {
        throw new Error(transcription.error.message || "Error en respuesta de Whisper");
      }

      const mapped = this.mapResponse(transcription);
      console.log("Transcripción completada:", mapped.text.length, "caracteres", {
        preview: mapped.text.slice(0, 80),
        detectedLanguage: mapped.detectedLanguage,
        durationSeconds: mapped.durationSeconds,
        averageLogProb: mapped.averageLogProb
      });
      return mapped;
    } catch (error) {
      console.error("Error interno en servicio de transcripción:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error procesando el audio. Por favor intente nuevamente.");
    }
  }
}
