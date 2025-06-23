/**
 * ClinicalAnalysisService.ts
 * 
 * Este servicio actúa como el cliente para el endpoint de análisis clínico del backend.
 * Su responsabilidad es tomar la transcripción del frontend, enviarla de forma segura
 * al backend y devolver el resultado del procesamiento de IA (incluyendo SOAP,
 * banderas rojas y recomendaciones).
 * 
 * Arquitectura: Frontend -> Este Servicio -> Backend API -> Gemini 1.5 Pro
 * 
 * @author AiDuxCare Development Team
 * @version 1.0
 */
import { SOAPResult } from '../types/nlp';
import { ProfessionalProfile } from '../types/professional';

const API_ENDPOINT = '/api/nlp-analysis'; // Usamos una ruta relativa para que Vite use el proxy

/**
 * Procesa una transcripción clínica completa a través del endpoint del backend.
 * 
 * @param transcription El texto completo de la transcripción.
 * @param professional El perfil del profesional que realiza la consulta.
 * @returns Una promesa que se resuelve con el resultado del análisis SOAP.
 * @throws Un error si la llamada a la API falla.
 */
export const processClinicalTranscription = async (
  transcription: string,
  professional: ProfessionalProfile
): Promise<SOAPResult> => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcription,
        professionalRole: professional.role,
        location: professional.location,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
      throw new Error(`Error del servidor: ${response.status} ${response.statusText} - ${errorData.message}`);
    }

    const result: SOAPResult = await response.json();
    return result;

  } catch (error) {
    console.error('Error al contactar el servicio de análisis clínico:', error);
    throw new Error('No se pudo conectar con el servicio de análisis de IA. Por favor, revise la conexión y los logs del servidor.');
  }
}; 