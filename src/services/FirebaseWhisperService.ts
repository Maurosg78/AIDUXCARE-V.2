import { auth } from '../lib/firebase';
import { WHISPER_MODEL } from '../config/env';

const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
const WHISPER_PROXY_URL = `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/whisperProxy`;

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
 * Servicio de transcripción de audio usando Firebase Cloud Function whisperProxy.
 * Llama a la función por HTTP (fetch) para no depender del SDK de Functions,
 * que en algunos entornos falla con "Service functions is not available".
 */
export class FirebaseWhisperService {
    /**
     * Transcribir audio usando el Cloud Function whisperProxy (vía HTTP).
     */
    static async transcribe(
        audioBlob: Blob,
        options: WhisperTranscriptionOptions = {}
    ): Promise<WhisperTranscriptionResult> {
        try {
            console.log('[FirebaseWhisper] Starting transcription via Cloud Function (HTTP)...');

            const base64Audio = await this.blobToBase64(audioBlob);
            if (!base64Audio || typeof base64Audio !== 'string' || base64Audio.length === 0) {
                throw new Error('Error al convertir el audio a Base64. El resultado está vacío.');
            }

            const model = WHISPER_MODEL || 'gpt-4o-mini-transcribe';
            const payload = {
                audioBase64: base64Audio,
                model,
                language: options.languageHint || 'auto',
                mode: options.mode || 'dictation',
                mimeType: audioBlob.type
            };

            const currentUser = auth?.currentUser;
            if (!currentUser) {
                throw new Error('Debe iniciar sesión para usar la transcripción.');
            }
            const idToken = await currentUser.getIdToken();

            console.log('[FirebaseWhisper] Calling whisperProxy (HTTP):', {
                model,
                language: options.languageHint || 'auto',
                mode: options.mode || 'dictation',
                audioSize: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`,
                mimeType: audioBlob.type
            });

            // Llamar a la callable vía POST (mismo formato que el SDK: body.data)
            const response = await fetch(WHISPER_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ data: payload })
            });

            const json = await response.json().catch(() => ({}));

            // Callable success: { result: { text, language, duration } }
            if (response.ok && json.result) {
                const data = json.result as { text?: string; language?: string; duration?: number };
                if (!data?.text) {
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
            }

            // Callable error: { error: { message, code, details } }
            const errMsg = json?.error?.message || json?.message || (response.ok ? 'Respuesta inválida' : `HTTP ${response.status}`);
            if (json?.error?.code === 'deadline-exceeded' || errMsg.toLowerCase().includes('deadline')) {
                throw new Error('La transcripción tomó demasiado tiempo. Por favor, intente con un audio más corto.');
            }
            if (json?.error?.code === 'unauthenticated' || errMsg.toLowerCase().includes('auth')) {
                throw new Error('Sesión expirada. Por favor, vuelva a iniciar sesión.');
            }
            if (errMsg.includes('API key') || errMsg.includes('key')) {
                throw new Error('Error de configuración del servicio. Por favor, contacte al administrador.');
            }
            throw new Error(errMsg);
        } catch (error: any) {
            console.error('[FirebaseWhisper] ❌ Transcription error:', error);
            throw new Error(
                error?.message || 'Error al transcribir el audio. Por favor, intente nuevamente.'
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