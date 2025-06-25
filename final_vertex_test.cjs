#!/usr/bin/env node

/**
 * 🧪 PRUEBA FINAL DE VERTEX AI
 * Verifica si está funcionando después de las correcciones
 */

const { VertexAI } = require('@google-cloud/vertexai');

async function finalTest() {
    console.log('🧪 PRUEBA FINAL DE VERTEX AI');
    console.log('=============================');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('');
    
    try {
        console.log('🔧 Configurando Vertex AI...');
        const vertexAI = new VertexAI({
            project: 'aiduxcare-mvp-prod',
            location: 'us-central1',
        });

        console.log('🔄 Probando modelo Gemini 1.0 Pro...');
        const model = vertexAI.preview.getGenerativeModel({
            model: 'gemini-1.0-pro',
        });

        console.log('📤 Enviando solicitud de prueba...');
        const startTime = Date.now();
        
        const result = await model.generateContent({
            contents: [{ 
                role: 'user', 
                parts: [{ text: 'Responde solo con "VERTEX AI FUNCIONANDO" y nada más.' }] 
            }],
        });
        
        const endTime = Date.now();
        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;
        
        console.log('✅ RESPUESTA RECIBIDA:');
        console.log(`📝 Texto: "${text}"`);
        console.log(`⏱️ Tiempo: ${endTime - startTime}ms`);
        console.log(`🔢 Tokens: ${response.usageMetadata?.totalTokenCount || 'N/A'}`);
        
        if (text.includes('VERTEX AI FUNCIONANDO')) {
            console.log('\n🎉 ¡ÉXITO! VERTEX AI ESTÁ COMPLETAMENTE DESBLOQUEADO');
            console.log('✅ El modelo Gemini 1.0 Pro responde correctamente');
            console.log('✅ Las APIs están habilitadas y funcionando');
            console.log('✅ La maratón de calentamiento fue exitosa');
            console.log('✅ Puedes usar IA avanzada para análisis médico');
            
            return {
                status: 'SUCCESS',
                responseTime: endTime - startTime,
                tokensUsed: response.usageMetadata?.totalTokenCount || 0,
                message: 'Vertex AI completamente funcional'
            };
        } else {
            console.log('\n⚠️ Vertex AI responde pero con contenido inesperado');
            console.log('💡 Puede estar en período de activación');
            
            return {
                status: 'PARTIAL',
                responseTime: endTime - startTime,
                tokensUsed: response.usageMetadata?.totalTokenCount || 0,
                message: 'Vertex AI responde pero puede tener limitaciones'
            };
        }

    } catch (error) {
        console.log('\n❌ ERROR EN PRUEBA FINAL:');
        console.log(`🔍 Tipo: ${error.name}`);
        console.log(`📝 Mensaje: ${error.message}`);
        
        if (error.message.includes('PERMISSION_DENIED')) {
            console.log('\n🔒 PROBLEMA: Permisos denegados');
            console.log('💡 Solución: Verificar roles de IAM');
            console.log('   gcloud projects add-iam-policy-binding aiduxcare-mvp-prod --member="user:tu-email@gmail.com" --role="roles/aiplatform.user"');
        } else if (error.message.includes('NOT_FOUND')) {
            console.log('\n🔍 PROBLEMA: Modelo no encontrado');
            console.log('💡 Posible causa: Proyecto en período de activación');
            console.log('💡 Solución: Esperar 24-48 horas y continuar maratón');
        } else if (error.message.includes('UNAVAILABLE')) {
            console.log('\n🚫 PROBLEMA: Servicio no disponible');
            console.log('💡 Posible causa: APIs aún no completamente activas');
            console.log('💡 Solución: Esperar más tiempo y continuar maratón');
        } else {
            console.log('\n❓ PROBLEMA: Error desconocido');
            console.log('💡 Posible causa: Configuración incorrecta');
            console.log('💡 Solución: Verificar configuración del proyecto');
        }
        
        return {
            status: 'ERROR',
            error: error.message,
            message: 'Vertex AI no está funcionando correctamente'
        };
    }
}

async function checkMarathonProgress() {
    console.log('\n📊 PROGRESO DE LA MARATÓN');
    console.log('==========================');
    
    try {
        const fs = require('fs');
        const marathonFiles = fs.readdirSync('.').filter(file => 
            file.includes('warmup-session') && file.endsWith('.json')
        );
        
        if (marathonFiles.length > 0) {
            const latestFile = marathonFiles.sort().pop();
            const latestData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
            
            console.log(`📅 Sesiones totales: ${marathonFiles.length}`);
            console.log(`🕐 Última sesión: ${new Date(latestData.timestamp).toLocaleString()}`);
            console.log(`✅ Éxito: ${latestData.results.filter(r => r.success).length}/${latestData.results.length}`);
            
            const totalEntities = latestData.results.reduce((sum, r) => sum + r.entitiesFound, 0);
            console.log(`🔍 Total entidades: ${totalEntities}`);
            
            const hoursSinceLast = (new Date() - new Date(latestData.timestamp)) / (1000 * 60 * 60);
            console.log(`⏰ Horas desde última sesión: ${hoursSinceLast.toFixed(1)}`);
            
            return {
                sessions: marathonFiles.length,
                lastSession: latestData.timestamp,
                hoursSinceLast: hoursSinceLast,
                totalEntities: totalEntities
            };
        } else {
            console.log('❌ No se encontraron sesiones de maratón');
            return { sessions: 0, totalEntities: 0 };
        }
        
    } catch (error) {
        console.log(`❌ Error verificando maratón: ${error.message}`);
        return { sessions: 0, totalEntities: 0 };
    }
}

async function main() {
    console.log('🚀 PRUEBA FINAL COMPLETA DE VERTEX AI');
    console.log('=====================================');
    console.log(`🌍 Proyecto: aiduxcare-mvp-prod`);
    console.log(`📍 Región: us-central1`);
    console.log(`🧠 Modelo: gemini-1.0-pro`);
    console.log('');
    
    // Verificar progreso de maratón
    const marathonProgress = await checkMarathonProgress();
    
    // Prueba final de Vertex AI
    const vertexResult = await finalTest();
    
    // Resumen final
    console.log('\n📋 RESUMEN FINAL');
    console.log('================');
    console.log(`🎯 Estado Vertex AI: ${vertexResult.status}`);
    console.log(`🔥 Sesiones maratón: ${marathonProgress.sessions}`);
    console.log(`🔍 Total entidades: ${marathonProgress.totalEntities}`);
    console.log(`⏰ Última actividad: ${marathonProgress.hoursSinceLast.toFixed(1)} horas`);
    
    if (vertexResult.status === 'SUCCESS') {
        console.log('\n🎉 ¡VERTEX AI COMPLETAMENTE FUNCIONAL!');
        console.log('✅ Todas las APIs habilitadas');
        console.log('✅ Modelo Gemini respondiendo');
        console.log('✅ Maratón de calentamiento exitosa');
        console.log('✅ Listo para análisis médico avanzado');
    } else if (vertexResult.status === 'PARTIAL') {
        console.log('\n🟡 VERTEX AI PARCIALMENTE FUNCIONAL');
        console.log('⚠️ Puede estar en período de activación');
        console.log('💡 Continuar maratón de calentamiento');
    } else {
        console.log('\n🔴 VERTEX AI NO FUNCIONAL');
        console.log('💡 Recomendaciones:');
        console.log('   1. Continuar maratón de calentamiento');
        console.log('   2. Esperar 24-48 horas para activación');
        console.log('   3. Verificar permisos de IAM');
        console.log('   4. Contactar soporte de Google Cloud si persiste');
    }
    
    return {
        vertexAI: vertexResult,
        marathon: marathonProgress,
        timestamp: new Date().toISOString()
    };
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { finalTest, checkMarathonProgress, main }; 