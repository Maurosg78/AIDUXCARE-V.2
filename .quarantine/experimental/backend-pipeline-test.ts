/**
 * 🏥 Backend Pipeline Test - AiDuxCare V.2
 * Protocolo de Validación de Backend End-to-End
 * 
 * Este script valida el "Cerebro Clínico" enviando casos de prueba reales
 * y midiendo el rendimiento y calidad del análisis de IA.
 */

interface TestCase {
  name: string;
  transcription: string;
}

interface ClinicalBrainRequest {
  transcription: string;
  specialty: string;
  sessionType: string;
}

interface ClinicalBrainResponse {
  success: boolean;
  data?: any;
  error?: string;
  processingTime?: number;
}

// Casos de prueba clínicos según especificación
const testCases: TestCase[] = [
  {
    name: "Caso 1: Lumbalgia Mecánica Simple",
    transcription: "Paciente refiere dolor lumbar en la zona derecha desde hace una semana después de levantar peso. El dolor aumenta con la flexión y se alivia con el reposo."
  },
  {
    name: "Caso 2: Cuadro Complejo con Banderas Rojas (Nuestro caso de prueba maestro)",
    transcription: "Hola Doctor hoy estoy muy adolorida de mi espalda esto no es nuevo me levanto cada mañana con mucho dolor en la parte baja de mi espalda y que a veces no me permite caminar incluso quedo como girada esto me viene pasando hace un tiempo y es mucho más molesto durante la mañana me cuesta partir incluso me cuesta salir de la cama y mi doctora sospecha de qué puede estar relacion con una posible celiaquía que tengo un estudio durante mucho tiempo me trataron como que fuera una enfermedad de artritis reumática sin embargo al parecer tengo un tema inmunológico también estoy deprimida y me están dando algunos medicamentos para la depresión trato de hacer ejercicio pero no puedo ser constante y no sé qué debo hacer me siento muy cansada constantemente y en el último examen de sangre me encontraron que el hierro estaba muy bajo y cuando estoy con mucho dolor estomacal porque he comido algo con gluten suelo tomar nolotil y paracetamol"
  }
];

// URL del Cerebro Clínico (Google Cloud Function)
const CLINICAL_BRAIN_URL = "https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/clinicalBrain";

/**
 * Función principal de validación del pipeline
 */
async function validateBackendPipeline(): Promise<void> {
  console.log("🏥 INICIANDO PROTOCOLO DE VALIDACIÓN BACKEND END-TO-END");
  console.log("=" .repeat(80));
  console.log("🎯 Objetivo: Validar el 'Cerebro Clínico' con casos de prueba reales");
  console.log("🔗 Endpoint: " + CLINICAL_BRAIN_URL);
  console.log("📊 Casos de prueba: " + testCases.length);
  console.log("=" .repeat(80));
  console.log("");

  let totalProcessingTime = 0;
  let successfulTests = 0;
  let failedTests = 0;

  // Iterar sobre cada caso de prueba
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`🧪 EJECUTANDO ${testCase.name}`);
    console.log("-".repeat(60));

    try {
      // Construir el body de la petición POST
      const requestBody: ClinicalBrainRequest = {
        transcription: testCase.transcription,
        specialty: 'physiotherapy',
        sessionType: 'initial'
      };

      console.log("📤 Enviando petición al Cerebro Clínico...");
      console.log("📋 Datos enviados:", JSON.stringify(requestBody, null, 2));
      console.log("");

      // Medir tiempo de respuesta
      const startTime = Date.now();
      console.time(`⏱️ Tiempo de respuesta - ${testCase.name}`);

      // Realizar llamada fetch al Cerebro Clínico
      const response = await fetch(CLINICAL_BRAIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      // Detener medidor de tiempo
      console.timeEnd(`⏱️ Tiempo de respuesta - ${testCase.name}`);
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      totalProcessingTime += processingTime;

      console.log(`⏱️ Tiempo total de procesamiento: ${processingTime}ms`);
      console.log("");

      // Verificar estado de la respuesta
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Obtener respuesta JSON completa
      const responseData = await response.json();
      
      console.log("✅ RESPUESTA EXITOSA DEL CEREBRO CLÍNICO");
      console.log("📊 Respuesta JSON completa y sin procesar:");
      console.log(JSON.stringify(responseData, null, 2));
      console.log("");

      // Análisis de la respuesta
      console.log("🔍 ANÁLISIS DE LA RESPUESTA:");
      console.log(`   - Status HTTP: ${response.status}`);
      console.log(`   - Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   - Tamaño respuesta: ${JSON.stringify(responseData).length} caracteres`);
      
      if (responseData.soap) {
        console.log(`   - SOAP generado: ${responseData.soap.subjective ? 'SÍ' : 'NO'}`);
        console.log(`   - Secciones SOAP: ${Object.keys(responseData.soap).length}`);
      }
      
      if (responseData.highlights) {
        console.log(`   - Highlights detectados: ${responseData.highlights.length}`);
      }
      
      if (responseData.warnings) {
        console.log(`   - Warnings detectados: ${responseData.warnings.length}`);
      }

      successfulTests++;
      console.log("✅ CASO EXITOSO");
      console.log("");

    } catch (error) {
      console.error("❌ ERROR EN EL CASO DE PRUEBA:");
      console.error("   Error:", error.message);
      console.error("   Stack:", error.stack);
      console.log("❌ CASO FALLIDO");
      console.log("");
      failedTests++;
    }

    // Separador entre casos
    if (i < testCases.length - 1) {
      console.log("=" .repeat(80));
      console.log("");
    }
  }

  // Resumen final
  console.log("🏁 RESUMEN FINAL DE LA VALIDACIÓN");
  console.log("=" .repeat(80));
  console.log(`📊 Total de casos ejecutados: ${testCases.length}`);
  console.log(`✅ Casos exitosos: ${successfulTests}`);
  console.log(`❌ Casos fallidos: ${failedTests}`);
  console.log(`⏱️ Tiempo total de procesamiento: ${totalProcessingTime}ms`);
  console.log(`📈 Tiempo promedio por caso: ${totalProcessingTime / testCases.length}ms`);
  console.log(`🎯 Tasa de éxito: ${((successfulTests / testCases.length) * 100).toFixed(1)}%`);
  console.log("=" .repeat(80));

  // Evaluación de rendimiento
  console.log("📈 EVALUACIÓN DE RENDIMIENTO:");
  const avgTime = totalProcessingTime / testCases.length;
  if (avgTime < 5000) {
    console.log("   🟢 EXCELENTE: Tiempo de respuesta < 5 segundos");
  } else if (avgTime < 10000) {
    console.log("   🟡 ACEPTABLE: Tiempo de respuesta < 10 segundos");
  } else {
    console.log("   🔴 CRÍTICO: Tiempo de respuesta > 10 segundos");
  }

  if (successfulTests === testCases.length) {
    console.log("   🟢 EXCELENTE: 100% de casos exitosos");
  } else if (successfulTests > 0) {
    console.log("   🟡 PARCIAL: Algunos casos fallaron");
  } else {
    console.log("   🔴 CRÍTICO: 0% de casos exitosos");
  }

  console.log("=" .repeat(80));
  console.log("🏥 PROTOCOLO DE VALIDACIÓN BACKEND COMPLETADO");
}

/**
 * Función de validación de conectividad
 */
async function validateConnectivity(): Promise<boolean> {
  console.log("🔍 VALIDANDO CONECTIVIDAD CON EL CEREBRO CLÍNICO...");
  
  try {
    const response = await fetch(CLINICAL_BRAIN_URL, {
      method: 'OPTIONS',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`   - Endpoint accesible: ${response.ok ? 'SÍ' : 'NO'}`);
    console.log(`   - CORS habilitado: ${response.headers.get('access-control-allow-origin') ? 'SÍ' : 'NO'}`);
    console.log(`   - Métodos permitidos: ${response.headers.get('access-control-allow-methods') || 'N/A'}`);
    
    return response.ok;
  } catch (error) {
    console.error("   ❌ Error de conectividad:", error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log("🚀 INICIANDO SCRIPT DE VALIDACIÓN BACKEND");
  console.log("📅 Fecha:", new Date().toISOString());
  console.log("");

  // Validar conectividad primero
  const isConnected = await validateConnectivity();
  console.log("");

  if (!isConnected) {
    console.error("❌ ERROR: No se puede conectar al Cerebro Clínico");
    console.error("   Verifique que la Google Cloud Function esté desplegada y accesible");
    process.exit(1);
  }

  // Ejecutar validación del pipeline
  await validateBackendPipeline();
}

// Ejecutar el script
main().catch(error => {
  console.error("💥 ERROR CRÍTICO EN EL SCRIPT:");
  console.error(error);
  process.exit(1);
}); 