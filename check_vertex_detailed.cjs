#!/usr/bin/env node

/**
 * 🔍 VERIFICACIÓN DETALLADA DE VERTEX AI
 * Prueba múltiples modelos y configuraciones
 */

const { VertexAI } = require('@google-cloud/vertexai');

async function testVertexAIModels() {
    console.log('🔍 VERIFICACIÓN DETALLADA DE VERTEX AI');
    console.log('=======================================');
    
    const models = [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'text-bison',
        'chat-bison'
    ];
    
    const locations = ['us-central1', 'us-east1', 'europe-west1'];
    
    for (const location of locations) {
        console.log(`\n📍 Probando ubicación: ${location}`);
        console.log('----------------------------------------');
        
        try {
            const vertexAI = new VertexAI({
                project: 'aiduxcare-mvp-prod',
                location: location,
            });
            
            for (const modelName of models) {
                try {
                    console.log(`🔄 Probando modelo: ${modelName}`);
                    
                    const model = vertexAI.preview.getGenerativeModel({
                        model: modelName,
                    });
                    
                    const startTime = Date.now();
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: 'Hola, responde con "OK"' }] }],
                    });
                    const endTime = Date.now();
                    
                    const response = result.response;
                    const text = response.candidates[0].content.parts[0].text;
                    
                    console.log(`✅ ${modelName}: FUNCIONANDO (${endTime - startTime}ms)`);
                    console.log(`📝 Respuesta: ${text.substring(0, 50)}...`);
                    
                    // Si encontramos un modelo que funciona, lo reportamos
                    if (text.includes('OK') || text.length > 0) {
                        console.log(`🎉 ¡MODELO ${modelName} DESBLOQUEADO EN ${location}!`);
                        return {
                            status: 'UNLOCKED',
                            model: modelName,
                            location: location,
                            responseTime: endTime - startTime,
                            message: `Vertex AI desbloqueado con ${modelName} en ${location}`
                        };
                    }
                    
                } catch (modelError) {
                    if (modelError.message.includes('NOT_FOUND')) {
                        console.log(`❌ ${modelName}: No disponible`);
                    } else if (modelError.message.includes('PERMISSION_DENIED')) {
                        console.log(`🔒 ${modelName}: Sin permisos`);
                    } else {
                        console.log(`⚠️ ${modelName}: Error - ${modelError.message.substring(0, 50)}...`);
                    }
                }
            }
            
        } catch (locationError) {
            console.log(`❌ Error en ubicación ${location}: ${locationError.message}`);
        }
    }
    
    return {
        status: 'BLOCKED',
        message: 'Ningún modelo de Vertex AI está disponible'
    };
}

async function checkProjectAccess() {
    console.log('\n🔍 VERIFICANDO ACCESO AL PROYECTO');
    console.log('==================================');
    
    try {
        const {GoogleAuth} = require('google-auth-library');
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        
        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        
        console.log(`✅ Proyecto autenticado: ${projectId}`);
        console.log(`🔑 Credenciales válidas: ${client ? 'SÍ' : 'NO'}`);
        
        // Verificar permisos específicos
        const scopes = client.scopes || [];
        console.log(`📋 Scopes disponibles: ${scopes.join(', ')}`);
        
        return {
            authenticated: true,
            projectId: projectId,
            scopes: scopes
        };
        
    } catch (error) {
        console.log(`❌ Error de autenticación: ${error.message}`);
        return {
            authenticated: false,
            error: error.message
        };
    }
}

async function checkBillingStatus() {
    console.log('\n💰 VERIFICANDO ESTADO DE FACTURACIÓN');
    console.log('====================================');
    
    try {
        const {CloudBillingClient} = require('@google-cloud/billing');
        const billingClient = new CloudBillingClient();
        
        const projectName = `projects/aiduxcare-mvp-prod`;
        const [billingInfo] = await billingClient.getProjectBillingInfo({name: projectName});
        
        console.log(`✅ Facturación habilitada: ${billingInfo.billingEnabled ? 'SÍ' : 'NO'}`);
        console.log(`🏷️ Cuenta de facturación: ${billingInfo.billingAccountName || 'No configurada'}`);
        
        return {
            billingEnabled: billingInfo.billingEnabled,
            billingAccount: billingInfo.billingAccountName
        };
        
    } catch (error) {
        console.log(`❌ Error verificando facturación: ${error.message}`);
        return {
            billingEnabled: false,
            error: error.message
        };
    }
}

async function checkAPIEnablement() {
    console.log('\n🔌 VERIFICANDO APIS HABILITADAS');
    console.log('===============================');
    
    const requiredAPIs = [
        'aiplatform.googleapis.com',
        'translate.googleapis.com',
        'healthcare.googleapis.com',
        'speech.googleapis.com'
    ];
    
    try {
        const {ServiceUsageClient} = require('@google-cloud/service-usage');
        const serviceUsageClient = new ServiceUsageClient();
        
        const projectName = `projects/aiduxcare-mvp-prod`;
        
        for (const api of requiredAPIs) {
            try {
                const [service] = await serviceUsageClient.getService({
                    name: `${projectName}/services/${api}`
                });
                
                console.log(`✅ ${api}: ${service.state === 'ENABLED' ? 'HABILITADA' : 'DESHABILITADA'}`);
                
            } catch (error) {
                console.log(`❌ ${api}: Error - ${error.message.substring(0, 50)}...`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error verificando APIs: ${error.message}`);
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
            console.log(`📅 Sesiones totales: ${marathonFiles.length}`);
            
            const latestFile = marathonFiles.sort().pop();
            const latestData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
            
            console.log(`🕐 Última sesión: ${new Date(latestData.timestamp).toLocaleString()}`);
            console.log(`✅ Éxito: ${latestData.results.filter(r => r.success).length}/${latestData.results.length}`);
            
            const totalEntities = latestData.results.reduce((sum, r) => sum + r.entitiesFound, 0);
            console.log(`🔍 Entidades totales: ${totalEntities}`);
            
            // Calcular tiempo desde la última sesión
            const lastSessionTime = new Date(latestData.timestamp);
            const now = new Date();
            const hoursSinceLastSession = (now - lastSessionTime) / (1000 * 60 * 60);
            
            console.log(`⏰ Horas desde última sesión: ${hoursSinceLastSession.toFixed(1)}`);
            
            if (hoursSinceLastSession > 2) {
                console.log('⚠️ La maratón puede haberse detenido');
            } else {
                console.log('✅ La maratón está activa');
            }
            
            return {
                sessions: marathonFiles.length,
                lastSession: latestData.timestamp,
                hoursSinceLast: hoursSinceLastSession,
                successRate: (latestData.results.filter(r => r.success).length / latestData.results.length) * 100
            };
        } else {
            console.log('❌ No se encontraron sesiones de maratón');
            return { sessions: 0, successRate: 0 };
        }
        
    } catch (error) {
        console.log(`❌ Error verificando maratón: ${error.message}`);
        return { sessions: 0, successRate: 0 };
    }
}

async function main() {
    console.log('🚀 VERIFICACIÓN COMPLETA DE VERTEX AI');
    console.log('=====================================');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🌍 Proyecto: aiduxcare-mvp-prod`);
    console.log('');
    
    // Verificar acceso al proyecto
    const projectAccess = await checkProjectAccess();
    
    // Verificar facturación
    const billingStatus = await checkBillingStatus();
    
    // Verificar APIs
    await checkAPIEnablement();
    
    // Verificar progreso de maratón
    const marathonProgress = await checkMarathonProgress();
    
    // Probar modelos de Vertex AI
    const vertexStatus = await testVertexAIModels();
    
    // Resumen final
    console.log('\n📋 RESUMEN FINAL');
    console.log('================');
    console.log(`🎯 Estado Vertex AI: ${vertexStatus.status}`);
    console.log(`🔑 Autenticación: ${projectAccess.authenticated ? '✅' : '❌'}`);
    console.log(`💰 Facturación: ${billingStatus.billingEnabled ? '✅' : '❌'}`);
    console.log(`🔥 Sesiones maratón: ${marathonProgress.sessions}`);
    console.log(`📊 Éxito maratón: ${marathonProgress.successRate}%`);
    
    if (vertexStatus.status === 'UNLOCKED') {
        console.log('\n🎉 ¡ÉXITO! VERTEX AI DESBLOQUEADO');
        console.log(`✅ Modelo: ${vertexStatus.model}`);
        console.log(`📍 Ubicación: ${vertexStatus.location}`);
        console.log('✅ Puedes usar IA avanzada para análisis médico');
    } else {
        console.log('\n🔒 VERTEX AI AÚN NO DESBLOQUEADO');
        console.log('💡 Recomendaciones:');
        console.log('   1. Continuar maratón de calentamiento');
        console.log('   2. Verificar facturación de Google Cloud');
        console.log('   3. Habilitar APIs necesarias');
        console.log('   4. Esperar 24-48 horas para activación');
    }
    
    return {
        vertexAI: vertexStatus,
        project: projectAccess,
        billing: billingStatus,
        marathon: marathonProgress,
        timestamp: new Date().toISOString()
    };
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testVertexAIModels, checkProjectAccess, checkBillingStatus, main }; 