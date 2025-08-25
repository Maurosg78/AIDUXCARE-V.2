/**
 * Google Cloud Speech-to-Text Service
 * Usa créditos gratuitos para transcripción continua sin timeouts
 */

export interface GoogleSTTConfig {
  apiKey: string;
  language: string;
  enableAutomaticPunctuation: boolean;
  enableSpeakerDiarization: boolean; // Separar médico vs paciente
}

export class GoogleSpeechToTextService {
  private config: GoogleSTTConfig;

  constructor(config: GoogleSTTConfig) {
    this.config = config;
  }

  async transcribeAudioChunk(audioBlob: Blob): Promise<string> {
    // TODO: Implementar llamada a Google Cloud Speech-to-Text API
    // Convierte audioBlob a base64 y envía a API
    console.log("Enviando chunk a Google Cloud STT:", audioBlob.size, "bytes");
    return "Transcripción pendiente"; // Placeholder
  }
}
