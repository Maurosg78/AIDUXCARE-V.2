/**
 * 🧪 TESTS DE INTEGRACIÓN: Google Cloud Pipeline
 * 
 * OBJETIVO: Validar que el pipeline de Google Cloud funciona correctamente 
 * después de la reparación del Error 500 textChunker.needsChunking.
 * 
 * METODOLOGÍA TDD COMPLETADA:
 * 1. 🔴 ROJO: Test falló con textChunker.needsChunking error → ✅ SOLUCIONADO
 * 2. 🔧 REPARACIÓN: Causa raíz corregida → ✅ COMPLETADO
 * 3. 🟢 VERDE: Pipeline funcional con Status 200 → ✅ VALIDANDO
 */

import { describe, it, expect } from 'vitest';

describe('Google Cloud Pipeline Integration', () => {
  const CLOUD_FUNCTION_ENDPOINT = 'https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/clinical-brain';
  
  // Casos de prueba que ahora deben funcionar correctamente
  const validationTestCases = [
    {
      name: "Caso Funcional: Dolor Cervical",
      transcription: "Paciente presenta dolor cervical con irradiación hacia el brazo derecho, especialmente al realizar movimientos de flexión lateral del cuello. Refiere que el dolor comenzó hace aproximadamente una semana.",
      specialty: "physiotherapy" as const,
      sessionType: "initial" as const,
      description: "Caso que previamente causaba textChunker.needsChunking error"
    },
    {
      name: "Caso Funcional: Emergencia Cardíaca", 
      transcription: "TERAPEUTA: Buenos días, ¿cómo se encuentra hoy? PACIENTE: Tengo un dolor muy fuerte en el pecho que se irradia hacia el brazo izquierdo. Comenzó esta mañana y no se me quita. También me falta el aire.",
      specialty: "general_medicine" as const,
      sessionType: "initial" as const,
      description: "Caso complejo que debe detectar banderas rojas cardiovasculares"
    },
    {
      name: "Caso Funcional: Transcripción Básica",
      transcription: "El paciente refiere dolor en el hombro derecho desde hace una semana.",
      specialty: "physiotherapy" as const,
      sessionType: "initial" as const,
      description: "Caso mínimo para validar funcionalidad básica"
    }
  ];

  // Tests de validación exitosa
  validationTestCases.forEach((testCase) => {
    it(`🟢 VALIDACIÓN: '${testCase.name}' debe procesarse exitosamente (Status 200)`, async () => {
      console.log(`🔍 EJECUTANDO VALIDACIÓN: ${testCase.name}`);
      console.log(`📋 Descripción: ${testCase.description}`);
      console.log(`📊 Request data:`, {
        transcriptionLength: testCase.transcription.length,
        specialty: testCase.specialty,
        sessionType: testCase.sessionType,
        preview: testCase.transcription.substring(0, 100) + '...'
      });
      console.log(`📡 Enviando request a Cloud Function...`);

      const requestBody = {
        transcription: testCase.transcription,
        specialty: testCase.specialty,
        sessionType: testCase.sessionType
      };

      let response: Response;
      let responseData: unknown;

      try {
        response = await fetch(CLOUD_FUNCTION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`📡 Respuesta recibida:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        const rawBody = await response.text();
        console.log(`�� Raw response body:`, rawBody.substring(0, 1000) + '...');

        try {
          responseData = JSON.parse(rawBody);
          console.log(`📋 Parsed response data keys:`, Object.keys(responseData as Record<string, unknown>));
        } catch (parseError) {
          console.log(`❌ Error parseando JSON:`, parseError);
          throw new Error(`Response no es JSON válido: ${rawBody.substring(0, 200)}`);
        }

        // ✅ VALIDAR STATUS 200 (ÉXITO)
        expect(response.status).toBe(200);
        expect(response.ok).toBe(true);

        // ✅ VALIDAR ESTRUCTURA DE RESPUESTA MÉDICA
        const data = responseData as Record<string, unknown>;
        expect(data).toHaveProperty('warnings');
        expect(data).toHaveProperty('suggestions');
        expect(data).toHaveProperty('soap_analysis');
        expect(data).toHaveProperty('session_quality');
        expect(data).toHaveProperty('metadata');

        // ✅ VALIDAR METADATOS DE PROCESAMIENTO
        const metadata = data.metadata as Record<string, unknown>;
        expect(metadata).toHaveProperty('processingTime');
        expect(metadata).toHaveProperty('modelUsed');
        expect(metadata).toHaveProperty('costOptimization');
        expect(metadata.version).toBe('2.0-optimized');

        // ✅ VALIDAR ARRAYS MÉDICOS
        expect(Array.isArray(data.warnings)).toBe(true);
        expect(Array.isArray(data.suggestions)).toBe(true);

        console.log(`🟢 VALIDACIÓN EXITOSA:`, {
          status: response.status,
          processingTime: metadata.processingTime,
          modelUsed: metadata.modelUsed,
          warningsCount: (data.warnings as unknown[]).length,
          suggestionsCount: (data.suggestions as unknown[]).length,
          soapQuality: (data.soap_analysis as Record<string, unknown>).overall_quality
        });

      } catch (networkError: unknown) {
        console.log(`❌ ERROR DE RED:`, networkError instanceof Error ? networkError.message : 'Error desconocido');
        
        // Si hay error de red, no es el Error 500 que estábamos reparando
        throw new Error(`Error de red inesperado: ${networkError instanceof Error ? networkError.message : 'Error desconocido'}`);
      }
    }, { timeout: 60000 }); // 60 segundos timeout para procesamiento médico
  });

  // Test de disponibilidad del endpoint
  it('🔍 VALIDACIÓN: Verificar disponibilidad del endpoint', async () => {
    console.log('🔍 VERIFICANDO DISPONIBILIDAD DEL ENDPOINT');
    
    try {
      const healthResponse = await fetch(CLOUD_FUNCTION_ENDPOINT, {
        method: 'GET'
      });
      
      console.log('🏥 Health check response:', { 
        status: healthResponse.status, 
        statusText: healthResponse.statusText, 
        ok: healthResponse.ok 
      });
      
      // GET debería devolver 405 Method Not Allowed (esperado para Cloud Function POST-only)
      expect([200, 405].includes(healthResponse.status)).toBe(true);
      
    } catch (error: unknown) {
      console.log('⚠️ Endpoint no disponible:', error instanceof Error ? error.message : 'Error desconocido');
      throw new Error(`Endpoint no disponible: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  });

  // Test de validación de formato de request
  it('🔍 VALIDACIÓN: Verificar manejo de request inválido', async () => {
    console.log('🔍 VALIDANDO MANEJO DE REQUEST INVÁLIDO');
    
    const invalidRequest = {
      // Transcripción faltante intencionalmente
      specialty: 'physiotherapy',
      sessionType: 'initial'
    };

    const response = await fetch(CLOUD_FUNCTION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidRequest)
    });

    console.log('📡 Response para request inválido:', { 
      status: response.status, 
      statusText: response.statusText 
    });

    // Debe devolver 400 Bad Request para datos inválidos
    expect(response.status).toBe(400);
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