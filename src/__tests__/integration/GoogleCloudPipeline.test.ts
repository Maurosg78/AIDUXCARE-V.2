/**
 * 🔴 TEST DE DIAGNÓSTICO TDD - GOOGLE CLOUD PIPELINE
 * 
 * OBJETIVO: Este test debe FALLAR inicialmente (ROJO) para diagnosticar 
 * el Error 500 textChunker.needsChunking que está afectando la Cloud Function.
 * 
 * METODOLOGÍA TDD:
 * 1. 🔴 ROJO: Test falla, captura error exacto
 * 2. 🔧 REPARACIÓN: Corregir causa raíz basada en logs
 * 3. 🟢 VERDE: Test pasa, pipeline funcional
 */

import { describe, test, expect, beforeAll } from 'vitest';

describe('🔴 Google Cloud Pipeline - Diagnóstico TDD', () => {
  const CLOUD_FUNCTION_ENDPOINT = 'https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/clinical-brain';
  
  // Casos de prueba que están causando el Error 500
  const failingTestCases = [
    {
      name: "Caso textChunker Original",
      transcription: "Paciente presenta dolor cervical con irradiación hacia el brazo derecho, especialmente al realizar movimientos de flexión lateral. Refiere que el dolor comenzó hace aproximadamente dos semanas tras realizar trabajos de jardinería.",
      specialty: "physiotherapy" as const,
      sessionType: "initial" as const,
      description: "Transcripción que históricamente causa textChunker.needsChunking error"
    },
    {
      name: "Caso Emergencia Cardiaca",
      transcription: "TERAPEUTA: Buenos días, ¿cómo se encuentra hoy? PACIENTE: Tengo un dolor muy fuerte en el pecho que se irradia hacia el brazo izquierdo. Comenzó esta mañana y no se quita con nada. También siento como si me faltara el aire.",
      specialty: "general_medicine" as const,
      sessionType: "initial" as const,
      description: "Caso complejo con diálogo estructurado que puede causar problemas de parsing"
    },
    {
      name: "Transcripción Mínima",
      transcription: "El paciente refiere dolor en el hombro derecho desde hace una semana.",
      specialty: "physiotherapy" as const,
      sessionType: "initial" as const,
      description: "Caso mínimo para aislamiento del error"
    }
  ];

  beforeAll(() => {
    console.log('🔴 INICIANDO TESTS DE DIAGNÓSTICO TDD');
    console.log('📍 Endpoint Cloud Function:', CLOUD_FUNCTION_ENDPOINT);
    console.log('🎯 Objetivo: Capturar Error 500 textChunker para reparación dirigida');
  });

  test.each(failingTestCases)(
    '🔴 DIAGNÓSTICO: $name debe fallar con Error 500 (estado actual)',
    async ({ name, transcription, specialty, sessionType, description }) => {
      console.log(`\n🔍 EJECUTANDO DIAGNÓSTICO: ${name}`);
      console.log(`📋 Descripción: ${description}`);
      console.log(`📊 Request data:`, {
        transcriptionLength: transcription.length,
        specialty,
        sessionType,
        preview: transcription.substring(0, 100) + '...'
      });

      const requestPayload = {
        transcription,
        specialty,
        sessionType
      };

      let response: Response;
      let errorDetails: any = null;
      let responseText: string = '';

      try {
        console.log('📡 Enviando request a Cloud Function...');
        
        response = await fetch(CLOUD_FUNCTION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload)
        });

        console.log('📡 Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Intentar leer el cuerpo de la respuesta
        try {
          responseText = await response.text();
          console.log('📋 Raw response body:', responseText);
          
          if (responseText) {
            try {
              errorDetails = JSON.parse(responseText);
              console.log('📋 Parsed error details:', errorDetails);
            } catch (parseError) {
              console.log('⚠️ No se pudo parsear como JSON, respuesta raw:', responseText);
            }
          }
        } catch (readError) {
          console.log('⚠️ Error leyendo respuesta:', readError);
        }

        // 🔴 EXPECTATIVA INICIAL (TEST ROJO):
        // Esperamos que falle con Error 500 para capturar el problema actual
        if (response.status === 500) {
          console.log('🔴 CONFIRMADO: Error 500 detectado como esperado');
          
          // Analizar el error específico
          const errorAnalysis = {
            hasTextChunkerError: responseText.includes('textChunker') || (errorDetails?.message || '').includes('textChunker'),
            hasVertexAIError: responseText.includes('Vertex') || responseText.includes('INVALID_ARGUMENT'),
            hasPromptError: responseText.includes('prompt') || responseText.includes('template'),
            fullErrorMessage: errorDetails?.message || responseText,
            errorType: errorDetails?.error || 'Unknown',
            timestamp: new Date().toISOString()
          };

          console.log('🔍 ANÁLISIS DEL ERROR:', errorAnalysis);

          // 🔴 TEST ROJO: Actualmente esperamos que falle
          expect(response.status).toBe(500);
          expect(errorAnalysis.hasTextChunkerError || errorAnalysis.hasVertexAIError).toBe(true);
          
          console.log('✅ Test ROJO completado - Error capturado para diagnóstico');
          
        } else if (response.ok) {
          // Si por algún motivo ya funciona, analizamos la respuesta
          const successData = errorDetails || { message: 'Respuesta exitosa inesperada' };
          console.log('🟢 INESPERADO: Respuesta exitosa (pipeline ya funcional?)', successData);
          
          // 🔴 Como este es el test rojo inicial, fallamos si funciona inesperadamente
          throw new Error(`Test ROJO inesperadamente pasó: Pipeline ya funcional? Status: ${response.status}`);
          
        } else {
          // Otro tipo de error HTTP
          console.log('⚠️ Error HTTP diferente a 500:', {
            status: response.status,
            statusText: response.statusText,
            body: responseText
          });
          
          // Documentamos otros errores pero esperamos 500 específicamente
          expect(response.status).toBe(500); // Esto fallará y documentará el error real
        }

      } catch (networkError) {
        console.error('❌ ERROR DE RED:', networkError);
        
        // Error de red es diferente al Error 500 que buscamos
        throw new Error(`Test ROJO falló por error de red, no por Error 500 esperado: ${networkError}`);
      }
    },
    30000 // Timeout de 30 segundos por test
  );

  test('🔍 DIAGNÓSTICO: Verificar disponibilidad del endpoint', async () => {
    console.log('\n🔍 VERIFICANDO DISPONIBILIDAD DEL ENDPOINT');
    
    try {
      const healthCheck = await fetch(`${CLOUD_FUNCTION_ENDPOINT}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('🏥 Health check response:', {
        status: healthCheck.status,
        statusText: healthCheck.statusText,
        ok: healthCheck.ok
      });

      if (healthCheck.ok) {
        const healthData = await healthCheck.json();
        console.log('✅ Endpoint disponible:', healthData);
      } else {
        console.log('⚠️ Endpoint no disponible o no tiene health check');
      }

    } catch (error) {
      console.log('⚠️ Error verificando endpoint:', error);
    }

    // Este test siempre pasa, solo es informativo
    expect(true).toBe(true);
  });

  test('🔴 DIAGNÓSTICO: Validar formato de request antes de envío', () => {
    console.log('\n🔍 VALIDANDO FORMATO DE REQUEST');
    
    const testPayload = {
      transcription: "Texto de prueba para validación",
      specialty: "physiotherapy" as const,
      sessionType: "initial" as const
    };

    // Validaciones básicas del payload
    expect(testPayload.transcription).toBeTruthy();
    expect(testPayload.transcription.length).toBeGreaterThan(0);
    expect(['physiotherapy', 'psychology', 'general_medicine']).toContain(testPayload.specialty);
    expect(['initial', 'follow_up']).toContain(testPayload.sessionType);

    const serializedPayload = JSON.stringify(testPayload);
    expect(serializedPayload).toBeTruthy();
    expect(() => JSON.parse(serializedPayload)).not.toThrow();

    console.log('✅ Formato de request válido:', {
      payloadSize: serializedPayload.length,
      structure: Object.keys(testPayload)
    });
  });
});

/**
 * 📋 NOTAS PARA LA REPARACIÓN:
 * 
 * Una vez que estos tests fallen (ROJO) y capturemos el error exacto:
 * 
 * 1. Analizar logs de la Cloud Function para ver prompt enviado a Vertex AI
 * 2. Identificar si el error es:
 *    - Formato del prompt inválido
 *    - Parámetros de Vertex AI incorrectos  
 *    - Problema en textChunker.needsChunking específicamente
 *    - Configuración de la función
 * 
 * 3. Reparar la causa raíz específica
 * 4. Cambiar expects de estos tests para que pasen (VERDE)
 * 5. Validar que el pipeline completo funciona
 * 
 * TRANSICIÓN ROJO → VERDE:
 * - expect(response.status).toBe(500) → expect(response.status).toBe(200)
 * - expect(errorAnalysis.hasTextChunkerError).toBe(true) → expect(responseData.success).toBe(true)
 */ 