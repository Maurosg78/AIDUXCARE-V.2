#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE VERIFICACIÓN VERTEX AI
 * Verifica si Vertex AI está desbloqueado y funcionando
 */

const { VertexAI } = require('@google-cloud/vertexai');

async function checkVertexAIStatus() {
    console.log('🔍 VERIFICANDO ESTADO DE VERTEX AI');
    console.log('=====================================');
    
    try {
        // Configurar Vertex AI
        const vertexAI = new VertexAI({
            project: 'aiduxcare-mvp-prod',
            location: 'us-central1',
        });

        const model = vertexAI.preview.getGenerativeModel({
            model: 'gemini-1.5-pro',
        });

        console.log('✅ Vertex AI configurado correctamente');
        console.log('🔄 Probando modelo Gemini 1.5 Pro...');

        // Test simple para verificar acceso
        const testPrompt = 'Responde solo con "VERTEX AI FUNCIONANDO"';
        
        const startTime = Date.now();
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: testPrompt }] }],
        });
        const endTime = Date.now();

        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;
        
        console.log('✅ RESPUESTA DE VERTEX AI:');
        console.log(`📝 Texto: ${text}`);
        console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
        console.log(`🔢 Tokens usados: ${response.usageMetadata?.totalTokenCount || 'N/A'}`);
        
        // Verificar si la respuesta es correcta
        if (text.includes('VERTEX AI FUNCIONANDO')) {
            console.log('\n🎉 ¡VERTEX AI ESTÁ DESBLOQUEADO Y FUNCIONANDO!');
            console.log('✅ El modelo Gemini 1.5 Pro responde correctamente');
            console.log('✅ La maratón de calentamiento fue exitosa');
            
            return {
                status: 'UNLOCKED',
                responseTime: endTime - startTime,
                tokensUsed: response.usageMetadata?.totalTokenCount || 0,
                message: 'Vertex AI desbloqueado y funcionando'
            };
        } else {
            console.log('\n⚠️ Vertex AI responde pero con contenido inesperado');
            return {
                status: 'PARTIAL',
                responseTime: endTime - startTime,
                tokensUsed: response.usageMetadata?.totalTokenCount || 0,
                message: 'Vertex AI responde pero puede tener limitaciones'
            };
        }

    } catch (error) {
        console.error('\n❌ ERROR AL VERIFICAR VERTEX AI:');
        console.error(`🔍 Tipo de error: ${error.name}`);
        console.error(`📝 Mensaje: ${error.message}`);
        
        // Análisis específico del error
        if (error.message.includes('PERMISSION_DENIED')) {
            console.log('\n🔒 VERTEX AI BLOQUEADO - Permisos denegados');
            console.log('💡 Necesitas más actividad de calentamiento');
        } else if (error.message.includes('NOT_FOUND')) {
            console.log('\n🔍 MODELO NO ENCONTRADO - Verificar configuración');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            console.log('\n📊 CUOTA EXCEDIDA - Límites de API alcanzados');
        } else if (error.message.includes('UNAVAILABLE')) {
            console.log('\n🚫 SERVICIO NO DISPONIBLE - Vertex AI no accesible');
        } else {
            console.log('\n❓ ERROR DESCONOCIDO - Revisar configuración');
        }
        
        return {
            status: 'BLOCKED',
            error: error.message,
            message: 'Vertex AI no está desbloqueado o hay errores de configuración'
        };
    }
}

async function checkGoogleCloudAPIs() {
    console.log('\n🔍 VERIFICANDO APIS DE GOOGLE CLOUD');
    console.log('====================================');
    
    const apis = [
        { name: 'Cloud Translation API', endpoint: 'https://translation.googleapis.com' },
        { name: 'Healthcare NLP API', endpoint: 'https://healthcare.googleapis.com' },
        { name: 'Speech-to-Text API', endpoint: 'https://speech.googleapis.com' }
    ];
    
    for (const api of apis) {
        try {
            const response = await fetch(api.endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Bearer token' : 'No credentials'}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`✅ ${api.name}: ${response.status === 200 ? 'Disponible' : 'Error ' + response.status}`);
        } catch (error) {
            console.log(`❌ ${api.name}: Error - ${error.message}`);
        }
    }
}

async function checkMarathonActivity() {
    console.log('\n📊 VERIFICANDO ACTIVIDAD DE LA MARATÓN');
    console.log('========================================');
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Buscar archivos de maratón
        const marathonFiles = fs.readdirSync('.').filter(file => 
            file.includes('warmup-session') && file.endsWith('.json')
        );
        
        if (marathonFiles.length > 0) {
            const latestFile = marathonFiles.sort().pop();
            const latestData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
            
            console.log(`📅 Última sesión: ${latestData.timestamp}`);
            console.log(`✅ Tests exitosos: ${latestData.results.filter(r => r.success).length}/${latestData.results.length}`);
            console.log(`⏱️ Tiempo promedio: ${latestData.results.reduce((sum, r) => sum + r.processingTime, 0) / latestData.results.length}ms`);
            
            const totalEntities = latestData.results.reduce((sum, r) => sum + r.entitiesFound, 0);
            console.log(`🔍 Total entidades: ${totalEntities}`);
            
            return {
                sessions: marathonFiles.length,
                lastSession: latestData.timestamp,
                successRate: (latestData.results.filter(r => r.success).length / latestData.results.length) * 100
            };
        } else {
            console.log('❌ No se encontraron archivos de maratón');
            return { sessions: 0, successRate: 0 };
        }
        
    } catch (error) {
        console.log(`❌ Error verificando maratón: ${error.message}`);
        return { sessions: 0, successRate: 0 };
    }
}

async function main() {
    console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DE VERTEX AI');
    console.log('================================================');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🌍 Proyecto: aiduxcare-mvp-prod`);
    console.log(`📍 Región: us-central1`);
    console.log('');
    
    // Verificar actividad de maratón
    const marathonStatus = await checkMarathonActivity();
    
    // Verificar APIs de Google Cloud
    await checkGoogleCloudAPIs();
    
    // Verificar Vertex AI
    const vertexStatus = await checkVertexAIStatus();
    
    // Resumen final
    console.log('\n📋 RESUMEN FINAL');
    console.log('================');
    console.log(`🎯 Estado Vertex AI: ${vertexStatus.status}`);
    console.log(`🔥 Sesiones de maratón: ${marathonStatus.sessions}`);
    console.log(`📊 Tasa de éxito maratón: ${marathonStatus.successRate}%`);
    
    if (vertexStatus.status === 'UNLOCKED') {
        console.log('\n🎉 ¡ÉXITO! Vertex AI está completamente desbloqueado');
        console.log('✅ Puedes usar Gemini 1.5 Pro para análisis médico avanzado');
        console.log('✅ La maratón de calentamiento fue exitosa');
    } else if (vertexStatus.status === 'PARTIAL') {
        console.log('\n⚠️ Vertex AI responde pero puede tener limitaciones');
        console.log('💡 Considera continuar la maratón de calentamiento');
    } else {
        console.log('\n🔒 Vertex AI aún no está desbloqueado');
        console.log('💡 Necesitas más actividad de calentamiento');
        console.log('🔄 Ejecuta más sesiones de maratón');
    }
    
    return {
        vertexAI: vertexStatus,
        marathon: marathonStatus,
        timestamp: new Date().toISOString()
    };
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkVertexAIStatus, checkMarathonActivity, main }; 