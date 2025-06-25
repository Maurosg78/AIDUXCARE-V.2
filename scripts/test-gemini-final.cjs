#!/usr/bin/env node

/**
 * 🧪 TEST DEFINITIVO GEMINI 1.5 PRO
 * Script final de validación para clasificación SOAP
 * 
 * Este script:
 * 1. Toma una transcripción de prueba
 * 2. La envía a Gemini 1.5 Pro
 * 3. Devuelve la clasificación SOAP
 * 4. Valida la funcionalidad core del producto
 */

const { VertexAI } = require("@google-cloud/vertexai");
const fs = require("fs");
const path = require("path");

// Configuración
const PROJECT_ID = "aiduxcare-mvp-prod";
const LOCATION = "us-central1";
const MODEL_NAME = "gemini-1.5-pro";

// Transcripción de prueba real
const TEST_TRANSCRIPTION = `
PACIENTE: Doctor, desde hace tres semanas tengo un dolor muy intenso en la parte baja de la espalda, 
específicamente en la zona lumbar. El dolor se irradia hacia la pierna derecha y siento como una 
sensación de hormigueo que llega hasta el pie. Cuando me siento o me levanto, el dolor empeora 
significativamente. También he notado que tengo dificultad para caminar largas distancias.

TERAPEUTA: Entiendo. ¿El dolor es constante o intermitente? ¿Hay alguna posición que lo alivie?

PACIENTE: Es más intenso por las mañanas y cuando estoy sentado mucho tiempo. Si me acuesto de lado 
con las piernas flexionadas, siento algo de alivio. También he notado que cuando toso o estornudo, 
el dolor se intensifica mucho.

TERAPEUTA: Voy a realizar algunas pruebas para evaluar la movilidad y la sensibilidad. 
¿Puede flexionar la columna hacia adelante? ¿Siente dolor al hacerlo?

PACIENTE: Sí, cuando me inclino hacia adelante siento un dolor agudo que se irradia hacia la pierna.

TERAPEUTA: Observo que hay limitación en la flexión lumbar y signos de tensión muscular. 
También noto que hay disminución de la sensibilidad en la parte lateral del pie derecho. 
Esto sugiere una posible compresión nerviosa a nivel L5-S1.

PACIENTE: ¿Es grave? ¿Qué tratamiento necesito?

TERAPEUTA: Basándome en la evaluación, parece ser una lumbociática por probable hernia discal 
L5-S1. Te recomiendo comenzar con fisioterapia específica, ejercicios de estabilización lumbar, 
y en algunos casos, terapia manual. También es importante evitar posiciones que aumenten la presión 
sobre el disco. Si el dolor persiste después de 4-6 semanas de tratamiento conservador, 
podríamos considerar estudios de imagen más específicos.
`;

// Prompt para clasificación SOAP
const SOAP_PROMPT = `
Eres un fisioterapeuta experto. Analiza la siguiente transcripción de una consulta médica y 
clasifica la información en formato SOAP (Subjective, Objective, Assessment, Plan).

TRANSCRIPCIÓN:
${TEST_TRANSCRIPTION}

Por favor, organiza la información de la siguiente manera:

SUBJECTIVE (S):
- Síntomas reportados por el paciente
- Historia del problema
- Factores que agravan o alivian

OBJECTIVE (O):
- Hallazgos del examen físico
- Observaciones del terapeuta
- Resultados de pruebas realizadas

ASSESSMENT (A):
- Diagnóstico clínico
- Hipótesis sobre la causa
- Nivel de severidad

PLAN (P):
- Tratamiento recomendado
- Intervenciones específicas
- Seguimiento y reevaluación

Responde únicamente con la clasificación SOAP, sin texto adicional.
`;

class GeminiFinalTest {
  constructor() {
    this.vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
    });
    this.model = this.vertexAI.preview.getGenerativeModel({
      model: MODEL_NAME,
      generation_config: {
        max_output_tokens: 2048,
        temperature: 0.1,
        top_p: 0.8,
        top_k: 40,
      },
    });
  }

  async runTest() {
    console.log("🧪 INICIANDO TEST DEFINITIVO GEMINI 1.5 PRO");
    console.log("=" .repeat(60));
    console.log(`STATS: Proyecto: ${PROJECT_ID}`);
    console.log(`📍 Ubicación: ${LOCATION}`);
    console.log(`🤖 Modelo: ${MODEL_NAME}`);
    console.log("=" .repeat(60));

    try {
      // Test 1: Verificar conectividad
      console.log("
🔍 Test 1: Verificando conectividad...");
      await this.testConnectivity();

      // Test 2: Clasificación SOAP
      console.log("
📋 Test 2: Clasificación SOAP...");
      const soapResult = await this.testSOAPClassification();

      // Test 3: Validación de respuesta
      console.log("
SUCCESS: Test 3: Validando respuesta...");
      this.validateSOAPResponse(soapResult);

      // Resultado final
      console.log("
🎉 TEST DEFINITIVO COMPLETADO EXITOSAMENTE");
      console.log("=" .repeat(60));
      console.log("SUCCESS: Gemini 1.5 Pro está funcionando correctamente");
      console.log("SUCCESS: Clasificación SOAP operativa");
      console.log("SUCCESS: Funcionalidad core validada");
      console.log("=" .repeat(60));

      return {
        success: true,
        soapResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("
ERROR: ERROR EN TEST DEFINITIVO:");
      console.error(error.message);
      
      if (error.message.includes("404")) {
        console.log("
💡 El modelo aún no está disponible. Continuar con la maratón de calentamiento.");
      }
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testConnectivity() {
    const startTime = Date.now();
    
    const result = await this.model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Responde únicamente con \"OK\"" }] }],
    });

    const response = result.response;
    const latency = Date.now() - startTime;

    console.log(`SUCCESS: Conectividad: OK (${latency}ms)`);
    console.log(`📝 Respuesta: ${response.text()}`);
  }

  async testSOAPClassification() {
    const startTime = Date.now();

    const result = await this.model.generateContent({
      contents: [{ role: "user", parts: [{ text: SOAP_PROMPT }] }],
    });

    const response = result.response;
    const latency = Date.now() - startTime;

    console.log(`SUCCESS: Clasificación SOAP completada (${latency}ms)`);
    console.log(`📝 Longitud respuesta: ${response.text().length} caracteres`);

    return response.text();
  }

  validateSOAPResponse(soapText) {
    const requiredSections = ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN"];
    const missingSections = [];

    for (const section of requiredSections) {
      if (!soapText.toUpperCase().includes(section)) {
        missingSections.push(section);
      }
    }

    if (missingSections.length > 0) {
      throw new Error(`Secciones SOAP faltantes: ${missingSections.join(", ")}`);
    }

    console.log("SUCCESS: Todas las secciones SOAP presentes");
    console.log("SUCCESS: Formato de respuesta válido");
  }

  saveResults(results) {
    const resultsDir = path.join(__dirname, "..", "logs");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `test-gemini-final-${new Date().toISOString().split("T")[0]}.json`;
    const filepath = path.join(resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
    console.log(`📁 Resultados guardados en: ${filepath}`);
  }
}

// Ejecución principal
async function main() {
  const test = new GeminiFinalTest();
  
  try {
    const results = await test.runTest();
    test.saveResults(results);
    
    if (results.success) {
      console.log("
📋 RESULTADO SOAP:");
      console.log("=" .repeat(60));
      console.log(results.soapResult);
      console.log("=" .repeat(60));
    }
    
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error("ERROR: Error fatal:", error.message);
    process.exit(1);
  }
}

// Manejo de señales para shutdown graceful
process.on("SIGINT", () => {
  console.log("
🛑 Test interrumpido por el usuario");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("
🛑 Test terminado");
  process.exit(0);
});

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}

module.exports = { GeminiFinalTest };
