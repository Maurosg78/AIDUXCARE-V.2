const { healthcare } = require("@googleapis/healthcare");
const { GoogleAuth } = require("google-auth-library");

async function testNlpDirect() {
  console.log(" Misión de Diagnóstico: FASE 3 - Test Aislado de Healthcare NLP API");
  console.log("===================================================================");

  try {
    console.log("1. Autenticando...");
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
    const authClient = await auth.getClient();
    console.log("   ✅ Autenticación exitosa.");

    console.log("2. Inicializando cliente de Healthcare...");
    const healthcareClient = healthcare({
      version: "v1beta1",
      auth: authClient,
    });
    console.log("   ✅ Cliente inicializado.");

    const projectId = "aiduxcare-mvp-prod";
    const location = "us-central1";
    const nlpService = `projects/${projectId}/locations/${location}/services/nlp`;
    const text = "el paciente tiene dolor de cabeza y fiebre";

    const requestPayload = {
      nlpService: nlpService,
      requestBody: {
        documentContent: text,
      },
    };

    console.log("3. Enviando solicitud a la API...");
    console.log("   Payload:", JSON.stringify(requestPayload, null, 2));

    const response = await healthcareClient.projects.locations.services.nlp.analyzeEntities(requestPayload);

    console.log("4. Respuesta recibida de la API.");
    console.log("   Respuesta Completa:", JSON.stringify(response, null, 2));

    if (response.data && response.data.entityMentions && response.data.entityMentions.length > 0) {
      console.log("\n Veredicto: ¡ÉXITO! La API de Healthcare NLP funciona de forma aislada.");
      console.log(` Encontradas ${response.data.entityMentions.length} entidades.`);
    } else {
      console.log("\n Veredicto: FALLIDO. La API respondió pero no encontró entidades.");
    }
  } catch (error) {
    console.error("\n Veredicto: ¡ERROR CRÍTICO EN TEST AISLADO!");
    console.error("   Detalles del error:", error);
  }
  console.log("===================================================================");
}

testNlpDirect(); 