const { VertexAI } = require('@google-cloud/vertexai');

async function testGeminiDirect() {
  console.log("🔍 Misión de Diagnóstico: FASE 3 - Test Aislado de Vertex AI (Gemini) API");
  console.log("=======================================================================");

  try {
    const projectId = "aiduxcare-mvp-prod";
    const location = "us-east1";
    
    console.log("1. Inicializando cliente de Vertex AI...");
    const vertexAI = new VertexAI({ project: projectId, location: location });
    console.log("   ✅ Cliente inicializado.");

    console.log("2. Seleccionando modelo Gemini...");
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.0-pro',
    });
    console.log("   ✅ Modelo seleccionado.");

    const requestPayload = {
      contents: [{ role: 'user', parts: [{ text: "dime hola" }] }],
    };

    console.log("3. Enviando solicitud a la API...");
    console.log("   Payload:", JSON.stringify(requestPayload, null, 2));
    
    const response = await generativeModel.generateContent(requestPayload);
    
    console.log("4. Respuesta recibida de la API.");
    console.log("   Respuesta Completa:", JSON.stringify(response, null, 2));

    if (response && response.response && response.response.candidates && response.response.candidates.length > 0) {
      console.log("\n Veredicto: ¡ÉXITO! La API de Vertex AI (Gemini) funciona de forma aislada.");
      console.log("   Respuesta de Gemini:", response.response.candidates[0].content.parts[0].text);
    } else {
      console.log("\n Veredicto: FALLIDO. La API respondió pero no generó contenido.");
    }
  } catch (error) {
    console.error("\n Veredicto: ¡ERROR CRÍTICO EN TEST AISLADO!");
    console.error("   Detalles del error:", error);
  }
  console.log("=======================================================================");
}

testGeminiDirect(); 