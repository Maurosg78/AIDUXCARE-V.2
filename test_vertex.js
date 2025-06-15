const language = require('@google-cloud/language');

const client = new language.LanguageServiceClient();

async function analyzeText() {
  try {
    console.log('Iniciando análisis de texto con Vertex AI...');
    
    const text = 'El paciente presenta síntomas de fiebre alta y dolor de cabeza. Recomiendo realizar análisis de sangre y mantener reposo.';
    const document = {
      content: text,
      type: 'PLAIN_TEXT',
      language: 'es'
    };

    // Análisis de entidades
    const [result] = await client.analyzeEntities({ document });
    console.log('PASS: Análisis de entidades completado');
    console.log('Entidades encontradas:');
    result.entities.forEach(entity => {
      console.log(`- ${entity.name} (${entity.type}): ${entity.salience}`);
    });

    // Análisis de sentimiento
    const [sentiment] = await client.analyzeSentiment({ document });
    console.log('\nPASS: Análisis de sentimiento completado');
    console.log(`Sentimiento general: ${sentiment.documentSentiment.score}`);

    process.exit(0);
  } catch (error) {
    console.error('FAIL:', error);
    process.exit(1);
  }
}

analyzeText(); 