/**
 * Firebase Whisper Service - Usa Cloud Function como proxy
 * 
 * Este servicio reemplaza las llamadas directas a OpenAI
 * con llamadas al Cloud Function whisperProxy.
 * 
 * @author AiduxCare Team
 * @date 2026-01-09
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface WhisperTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  processingTimeMs?: number;
}

export interface WhisperTranscriptionOptions {
  language?: string;
  timeout?: number;
}

/**
 * Servicio de transcripción usando Firebase Cloud Function
 */
export class FirebaseWhisperService {
  
  /**
   * Transcribir audio usando el Cloud Function whisperProxy
   * 
   * @param audioBlob - Blob de audio a transcribir
   * @param mimeType - MIME type del audio
   * @param options - Opciones de transcripción
   * @returns Resultado de transcripción
   */
  async transcribe(
    audioBlob: Blob,
    mimeType: string,
    options: WhisperTranscriptionOptions = {}
  ): Promise<WhisperTranscriptionResult> {
    
    console.log(`[FirebaseWhisper] Starting transcription: ${(audioBlob.size / 1024).toFixed(2)} KB, type: ${mimeType}`);
    
    try {
      // ============================================
      // 1. CONVERTIR BLOB A BASE64
      // ============================================
      
      const audioBase64 = await this.blobToBase64(audioBlob);
      console.log(`[FirebaseWhisper] Converted to base64: ${audioBase64.length} chars`);
      
      // ============================================
      // 2. LLAMAR AL CLOUD FUNCTION
      // ============================================
      
      if (!functions) {
        throw new Error('Firebase Functions not initialized. Please check Firebase configuration.');
      }

      const whisperProxyFunction = httpsCallable(functions, 'whisperProxy', {
        timeout: options.timeout || 300000, // 5 minutos default
      });
      
      const startTime = Date.now();
      
      const result = await whisperProxyFunction({
        audioBase64: audioBase64,
        mimeType: mimeType,
        language: options.language || 'auto',
      });
      
      const elapsedTime = Date.now() - startTime;
      
      console.log(`[FirebaseWhisper] ✅ Transcription completed in ${elapsedTime}ms`);
      console.log(`[FirebaseWhisper] Text length: ${(result.data as any).text?.length || 0} chars`);
      
      // ============================================
      // 3. RETORNAR RESULTADO
      // ============================================
      
      return result.data as WhisperTranscriptionResult;
      
    } catch (error: any) {
      console.error('[FirebaseWhisper] Transcription error:', error);
      
      // Parsear errores de Cloud Function
      if (error.code) {
        switch (error.code) {
          case 'unauthenticated':
            throw new Error('User must be authenticated to use transcription service');
          case 'invalid-argument':
            throw new Error(`Invalid audio data: ${error.message}`);
          case 'resource-exhausted':
            throw new Error('OpenAI API rate limit exceeded. Please try again later.');
          case 'failed-precondition':
            throw new Error('Transcription service is not properly configured');
          default:
            throw new Error(`Transcription failed: ${error.message}`);
        }
      }
      
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }
  
  /**
   * Helper: Convertir Blob a Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remover el prefijo "data:audio/...;base64,"
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read audio blob'));
      };
      
      reader.readAsDataURL(blob);
    });
  }
}

// Exportar instancia singleton
export const firebaseWhisperService = new FirebaseWhisperService();

