#!/usr/bin/env node

const { VertexAI } = require('@google-cloud/vertexai');

const PROJECT_ID = 'aiduxcare-mvp-prod';
const REGIONS = ['us-central1', 'us-east1', 'us-west1', 'europe-west1', 'asia-southeast1'];

async function testVertexAIRegions() {
    console.log('🔍 PROBANDO DISPONIBILIDAD DE VERTEX AI POR REGIÓN');
    console.log('='.repeat(60));
    
    for (const region of REGIONS) {
        try {
            console.log(`📍 Probando región: ${region}`);
            
            const vertexAI = new VertexAI({
                project: PROJECT_ID,
                location: region
            });
            
            // Probar diferentes modelos
            const models = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
            
            for (const modelName of models) {
                try {
                    const model = vertexAI.getGenerativeModel({ model: modelName });
                    
                    // Hacer una consulta muy simple
                    const result = await model.generateContent('Hola');
                    
                    console.log(`✅ ${region} - ${modelName}: DISPONIBLE`);
                    console.log(`   Respuesta: ${result.response.text()?.substring(0, 50)}...`);
                    
                    // Si encontramos uno que funciona, podemos parar
                    return { region, model: modelName, status: 'AVAILABLE' };
                    
                } catch (error) {
                    console.log(`❌ ${region} - ${modelName}: ${error.message.substring(0, 100)}...`);
                }
            }
            
        } catch (error) {
            console.log(`🚨 ${region}: Error de configuración - ${error.message.substring(0, 100)}...`);
        }
        
        console.log('');
    }
    
    return { status: 'NOT_AVAILABLE' };
}

async function main() {
    try {
        const result = await testVertexAIRegions();
        
        console.log('📊 RESULTADO FINAL:');
        console.log('='.repeat(30));
        
        if (result.status === 'AVAILABLE') {
            console.log(`🎯 VERTEX AI DISPONIBLE EN: ${result.region}`);
            console.log(`🤖 MODELO FUNCIONAL: ${result.model}`);
            console.log('💡 Actualiza tu configuración para usar esta región');
        } else {
            console.log('🚨 VERTEX AI NO DISPONIBLE EN NINGUNA REGIÓN');
            console.log('💡 Posibles causas:');
            console.log('   1. Cuotas insuficientes');
            console.log('   2. Facturación no configurada correctamente');
            console.log('   3. Permisos IAM insuficientes');
            console.log('   4. Proyecto no elegible para Gemini');
        }
        
    } catch (error) {
        console.error('ERROR GENERAL:', error);
    }
}

main(); 