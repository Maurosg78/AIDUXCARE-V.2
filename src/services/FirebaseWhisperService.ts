import { httpsCallable } from 'firebase/functions';
import { app, getFunctionsInstance } from '../lib/firebase';
import { WHISPER_MODEL } from '../config/env';

export interface WhisperTranscriptionResult {
    // Bloque 3B: Campos opcionales agregados para compatibilidad
    detectedLanguage?: string | null;
    averageLogProb?: number | null;
    durationSeconds?: number | null;
    text: string;
    language?: string;
    duration?: number;
}

export interface WhisperTranscriptionOptions {
    languageHint?: string;
    mode?: 'live' | 'dictation';
}

/**
 * Servicio de transcripción de audio usando Firebase Cloud Function whisperProxy
 * 
 * Este servicio resuelve el problema de CORS al llamar a la API de OpenAI directamente
 * desde el navegador. El Cloud Function maneja la autenticación y las llamadas a la API.
 */
export class FirebaseWhisperService {
    /**
     * Transcribir audio usando el Cloud Function whisperProxy
     * 
     * @param audioBlob - Blob de audio a transcribir
     * @param options - Opciones de transcripción (idioma, modo)
     * @returns Resultado de la transcripción
     */
    static async transcribe(
        audioBlob: Blob,
        options: WhisperTranscriptionOptions = {}
    ): Promise<WhisperTranscriptionResult> {
        try {
            console.log('[FirebaseWhisper] Starting transcription via Cloud Function...');

            // ✅ CRITICAL: Use lazy-initialized Functions instance
            const functions = getFunctionsInstance();

            console.log('[FirebaseWhisper] Using Functions instance:', {
                functionsExists: !!functions,
                appExists: !!app,
                projectId: app?.options?.projectId || 'unknown'
            });

            // Llamar al Cloud Function whisperProxy
            const whisperProxyFunction = httpsCallable(functions, 'whisperProxy', {
                timeout: 300000 // 5 minutos para audio largo
            });

            // Convertir Blob a base64 para enviar al Cloud Function
            const base64Audio = await this.blobToBase64(audioBlob);

            // Validar que la conversión fue exitosa
            if (!base64Audio || typeof base64Audio !== 'string' || base64Audio.length === 0) {
                throw new Error('Error al convertir el audio a Base64. El resultado está vacío.');
            }

            // Determinar el modelo a usar
            const model = WHISPER_MODEL || 'gpt-4o-mini-transcribe';

            // Preparar payload
            // ✅ IMPORTANTE: El Cloud Function espera 'audioBase64' (string Base64)
            const payload = {
                audioBase64: base64Audio,  // ✅ Nombre correcto: 'audioBase64' (Base64 string)
                model: model,
                language: options.languageHint || 'auto',
                mode: options.mode || 'dictation',
                mimeType: audioBlob.type
            };

            console.log('[FirebaseWhisper] Calling whisperProxy with:', {
                model,
                language: options.languageHint || 'auto',
                mode: options.mode || 'dictation',
                audioSize: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`,
                mimeType: audioBlob.type,
                audioBase64Length: base64Audio.length,  // ✅ Verificar que Base64 está presente
                audioBase64Preview: base64Audio.substring(0, 50) + '...'  // Preview para debugging
            });

            // Llamar al Cloud Function
            const result = await whisperProxyFunction(payload);

            // El resultado viene en formato { data: { text, language, duration } }
            const data = result.data as any;

            if (!data || !data.text) {
                throw new Error('La transcripción no devolvió texto');
            }

            console.log('[FirebaseWhisper] ✅ Transcription successful:', {
                textLength: data.text.length,
                language: data.language,
                duration: data.duration
            });

            return {
                text: data.text,
                language: data.language,
                duration: data.duration
            };
        } catch (error: any) {
            console.error('[FirebaseWhisper] ❌ Transcription error:', error);

            // Manejar errores específicos
            if (error.code === 'functions/not-found') {
                throw new Error('El servicio de transcripción no está disponible. Por favor, contacte al administrador.');
            }

            if (error.code === 'functions/deadline-exceeded') {
                throw new Error('La transcripción tomó demasiado tiempo. Por favor, intente con un audio más corto.');
            }

            if (error.message?.includes('API key')) {
                throw new Error('Error de autenticación. Por favor, contacte al administrador.');
            }

            // Error genérico
            throw new Error(
                error.message || 'Error al transcribir el audio. Por favor, intente nuevamente.'
            );
        }
    }

    /**
     * Convertir Blob a base64
     * 
     * @param blob - Blob de audio a convertir
     * @returns Promise<string> - String Base64 sin prefijo data URL
     */
    private static async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            // Validar que el Blob tiene contenido
            if (!blob || blob.size === 0) {
                reject(new Error('El Blob de audio está vacío o no es válido'));
                return;
            }

            const reader = new FileReader();

            reader.onloadend = () => {
                try {
                    if (!reader.result) {
                        reject(new Error('FileReader no devolvió resultado'));
                        return;
                    }

                    const base64String = reader.result as string;

                    // Validar que el resultado es un string
                    if (typeof base64String !== 'string') {
                        reject(new Error('FileReader devolvió un resultado que no es string'));
                        return;
                    }

                    // Remover el prefijo data:audio/...;base64,
                    // El formato es: "data:audio/webm;base64,<base64data>"
                    const parts = base64String.split(',');
                    if (parts.length < 2) {
                        reject(new Error('Formato de data URL inválido. No se encontró el separador ","'));
                        return;
                    }

                    const base64Data = parts[1];

                    // Validar que el Base64 no está vacío
                    if (!base64Data || base64Data.length === 0) {
                        reject(new Error('El Base64 resultante está vacío'));
                        return;
                    }

                    console.log('[FirebaseWhisper] ✅ Blob convertido a Base64:', {
                        originalSize: blob.size,
                        base64Length: base64Data.length,
                        preview: base64Data.substring(0, 30) + '...'
                    });

                    resolve(base64Data);
                } catch (error) {
                    reject(new Error(`Error al procesar resultado de FileReader: ${error}`));
                }
            };

            reader.onerror = (error) => {
                reject(new Error(`Error al leer el Blob: ${error}`));
            };

            reader.readAsDataURL(blob);
        });
    }
}

// Exportar instancia singleton
export const firebaseWhisperService = new FirebaseWhisperService();