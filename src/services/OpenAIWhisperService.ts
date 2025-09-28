// @ts-nocheck
// src/services/OpenAIWhisperService.ts

export class OpenAIWhisperService {
  private static readonly API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private static readonly API_URL = 'https://api.openai.com/v1/audio/transcriptions';

  static async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.API_KEY) {
      console.error('OpenAI API key no configurada');
      throw new Error('Servicio de transcripción no configurado. Contacte al administrador.');
    }

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');
      formData.append('response_format', 'text');

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        console.error('Whisper API error:', response.status);
        throw new Error('Servicio de transcripción temporalmente no disponible');
      }

      const transcription = await response.text();
      console.log('Transcripción completada:', transcription.length, 'caracteres');
      
      return transcription.trim();
    } catch (error) {
      console.error('Error interno en servicio de transcripción:', error);
      
      // Mensaje genérico para el usuario
      if (error instanceof Error && error.message.includes('temporalmente')) {
        throw error;
      }
      throw new Error('Error procesando el audio. Por favor intente nuevamente.');
    }
  }
}