const { healthcare } = require('@googleapis/healthcare');
const { GoogleAuth } = require('google-auth-library');

async function testNLPWithServiceAccount() {
  try {
    console.log('🧪 Probando Healthcare NLP con cuenta de servicio...');
    
    const auth = new GoogleAuth({
      keyFile: './aiduxcare-nlp-credentials.json',
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });

    const healthcareClient = healthcare({
      version: 'v1beta1',
      auth: auth,
    });

    const projectId = 'aiduxcare-mvp-prod';
    const location = 'us-central1';
    const nlpService = `projects/${projectId}/locations/${location}/services/nlp`;

    console.log('🔄 Enviando texto a Google Cloud Healthcare NLP...');
    
    const response = await healthcareClient.projects.locations.services.nlp.analyzeEntities({
      nlpService: nlpService,
      requestBody: {
        documentContent: 'El paciente refiere dolor en el hombro derecho desde hace 3 semanas.',
      },
    });

    console.log('✅ ¡ÉXITO! Respuesta de Healthcare NLP:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Error en prueba local:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    return false;
  }
}

testNLPWithServiceAccount(); 