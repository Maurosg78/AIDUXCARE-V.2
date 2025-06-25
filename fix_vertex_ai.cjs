#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE REPARACIÓN VERTEX AI
 * Diagnostica y corrige problemas de configuración
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function checkBillingWithGCloud() {
    console.log('💰 VERIFICANDO FACTURACIÓN CON GCLOUD');
    console.log('=====================================');
    
    try {
        // Verificar proyecto actual
        const { stdout: projectOutput } = await execAsync('gcloud config get-value project');
        const currentProject = projectOutput.trim();
        console.log(`📍 Proyecto actual: ${currentProject}`);
        
        // Verificar facturación
        const { stdout: billingOutput } = await execAsync('gcloud billing projects describe aiduxcare-mvp-prod --format="value(billingEnabled)"');
        const billingEnabled = billingOutput.trim();
        console.log(`💰 Facturación habilitada: ${billingEnabled === 'True' ? '✅ SÍ' : '❌ NO'}`);
        
        if (billingEnabled !== 'True') {
            console.log('⚠️ FACTURACIÓN NO HABILITADA');
            console.log('💡 Para habilitar facturación:');
            console.log('   1. Ve a https://console.cloud.google.com/billing');
            console.log('   2. Selecciona tu proyecto');
            console.log('   3. Habilita facturación');
            console.log('   4. O ejecuta: gcloud billing projects link aiduxcare-mvp-prod --billing-account=TU_CUENTA_BILLING');
        }
        
        return billingEnabled === 'True';
        
    } catch (error) {
        console.log(`❌ Error verificando facturación: ${error.message}`);
        return false;
    }
}

async function checkAndEnableAPIs() {
    console.log('\n🔌 VERIFICANDO Y HABILITANDO APIS');
    console.log('==================================');
    
    const requiredAPIs = [
        'aiplatform.googleapis.com',
        'translate.googleapis.com',
        'healthcare.googleapis.com',
        'speech.googleapis.com',
        'cloudbuild.googleapis.com'
    ];
    
    for (const api of requiredAPIs) {
        try {
            console.log(`🔄 Verificando: ${api}`);
            
            // Verificar si la API está habilitada
            const { stdout: statusOutput } = await execAsync(`gcloud services list --enabled --filter="name:${api}" --format="value(name)"`);
            const isEnabled = statusOutput.trim() === api;
            
            if (isEnabled) {
                console.log(`✅ ${api}: Ya habilitada`);
            } else {
                console.log(`❌ ${api}: No habilitada - habilitando...`);
                
                try {
                    await execAsync(`gcloud services enable ${api}`);
                    console.log(`✅ ${api}: Habilitada exitosamente`);
                } catch (enableError) {
                    console.log(`❌ Error habilitando ${api}: ${enableError.message}`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Error verificando ${api}: ${error.message}`);
        }
    }
}

async function checkVertexAIAccess() {
    console.log('\n🔍 VERIFICANDO ACCESO A VERTEX AI');
    console.log('==================================');
    
    try {
        // Verificar si podemos listar modelos
        const { stdout: modelsOutput } = await execAsync('gcloud ai models list --region=us-central1 --limit=5');
        console.log('✅ Puedes listar modelos de Vertex AI');
        console.log('📋 Modelos disponibles:');
        console.log(modelsOutput);
        
        return true;
        
    } catch (error) {
        console.log(`❌ No puedes acceder a Vertex AI: ${error.message}`);
        
        if (error.message.includes('PERMISSION_DENIED')) {
            console.log('🔒 Problema de permisos');
            console.log('💡 Soluciones:');
            console.log('   1. Verificar que tienes rol "Vertex AI User"');
            console.log('   2. Ejecutar: gcloud projects add-iam-policy-binding aiduxcare-mvp-prod --member="user:tu-email@gmail.com" --role="roles/aiplatform.user"');
        } else if (error.message.includes('NOT_FOUND')) {
            console.log('🔍 API no encontrada');
            console.log('💡 Ejecutar: gcloud services enable aiplatform.googleapis.com');
        }
        
        return false;
    }
}

async function testSimpleVertexAI() {
    console.log('\n🧪 PRUEBA SIMPLE DE VERTEX AI');
    console.log('=============================');
    
    try {
        // Crear un archivo temporal para la prueba
        const testScript = `
const { VertexAI } = require('@google-cloud/vertexai');

async function test() {
    try {
        const vertexAI = new VertexAI({
            project: 'aiduxcare-mvp-prod',
            location: 'us-central1',
        });

        const model = vertexAI.preview.getGenerativeModel({
            model: 'gemini-1.0-pro',
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'Di solo OK' }] }],
        });

        console.log('✅ VERTEX AI FUNCIONANDO');
        console.log('📝 Respuesta:', result.response.candidates[0].content.parts[0].text);
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

test();
`;
        
        require('fs').writeFileSync('temp_vertex_test.js', testScript);
        
        const { stdout, stderr } = await execAsync('node temp_vertex_test.js');
        
        if (stdout.includes('VERTEX AI FUNCIONANDO')) {
            console.log('🎉 ¡VERTEX AI ESTÁ DESBLOQUEADO!');
            console.log(stdout);
            return true;
        } else {
            console.log('❌ Vertex AI no responde correctamente');
            console.log(stderr || stdout);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error en prueba: ${error.message}`);
        return false;
    } finally {
        // Limpiar archivo temporal
        try {
            require('fs').unlinkSync('temp_vertex_test.js');
        } catch (e) {
            // Ignorar error de limpieza
        }
    }
}

async function checkMarathonStatus() {
    console.log('\n📊 ESTADO DE LA MARATÓN');
    console.log('=======================');
    
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
            
            const hoursSinceLast = (new Date() - new Date(latestData.timestamp)) / (1000 * 60 * 60);
            console.log(`⏰ Horas desde última sesión: ${hoursSinceLast.toFixed(1)}`);
            
            if (hoursSinceLast > 1) {
                console.log('⚠️ La maratón puede haberse detenido');
                console.log('💡 Ejecutar: ./run_warmup_marathon.sh');
            } else {
                console.log('✅ La maratón está activa');
            }
            
            return {
                sessions: marathonFiles.length,
                lastSession: latestData.timestamp,
                hoursSinceLast: hoursSinceLast,
                active: hoursSinceLast <= 1
            };
        } else {
            console.log('❌ No se encontraron sesiones de maratón');
            return { sessions: 0, active: false };
        }
        
    } catch (error) {
        console.log(`❌ Error verificando maratón: ${error.message}`);
        return { sessions: 0, active: false };
    }
}

async function restartMarathon() {
    console.log('\n🔄 REINICIANDO MARATÓN');
    console.log('======================');
    
    try {
        // Detener procesos existentes
        console.log('🛑 Deteniendo procesos de maratón...');
        await execAsync('pkill -f "run_warmup_marathon"');
        
        // Esperar un momento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Iniciar nueva maratón
        console.log('🚀 Iniciando nueva maratón...');
        const { stdout } = await execAsync('./run_warmup_marathon.sh', { timeout: 30000 });
        
        console.log('✅ Maratón reiniciada');
        console.log(stdout.substring(0, 200) + '...');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error reiniciando maratón: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔧 DIAGNÓSTICO Y REPARACIÓN DE VERTEX AI');
    console.log('=========================================');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('');
    
    // Verificar facturación
    const billingEnabled = await checkBillingWithGCloud();
    
    // Verificar y habilitar APIs
    await checkAndEnableAPIs();
    
    // Verificar acceso a Vertex AI
    const vertexAccess = await checkVertexAIAccess();
    
    // Probar Vertex AI
    const vertexWorking = await testSimpleVertexAI();
    
    // Verificar maratón
    const marathonStatus = await checkMarathonStatus();
    
    // Resumen y recomendaciones
    console.log('\n📋 RESUMEN Y RECOMENDACIONES');
    console.log('=============================');
    console.log(`💰 Facturación: ${billingEnabled ? '✅' : '❌'}`);
    console.log(`🔌 APIs: ${vertexAccess ? '✅' : '❌'}`);
    console.log(`🧠 Vertex AI: ${vertexWorking ? '✅' : '❌'}`);
    console.log(`🔥 Maratón: ${marathonStatus.active ? '✅' : '❌'}`);
    
    if (!billingEnabled) {
        console.log('\n🔴 PROBLEMA CRÍTICO: Facturación no habilitada');
        console.log('💡 Solución: Habilitar facturación en Google Cloud Console');
    }
    
    if (!vertexWorking) {
        console.log('\n🟡 PROBLEMA: Vertex AI no funciona');
        console.log('💡 Posibles causas:');
        console.log('   - APIs no habilitadas');
        console.log('   - Permisos insuficientes');
        console.log('   - Proyecto en período de activación');
        console.log('   - Necesita más actividad de calentamiento');
    }
    
    if (!marathonStatus.active) {
        console.log('\n🟡 PROBLEMA: Maratón inactiva');
        console.log('💡 Solución: Reiniciar maratón');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question('¿Reiniciar maratón ahora? (y/n): ', resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() === 'y') {
            await restartMarathon();
        }
    }
    
    if (billingEnabled && vertexWorking) {
        console.log('\n🎉 ¡VERTEX AI ESTÁ COMPLETAMENTE FUNCIONAL!');
        console.log('✅ Puedes usar IA avanzada para análisis médico');
    } else {
        console.log('\n🔧 PRÓXIMOS PASOS:');
        console.log('1. Habilitar facturación si no está habilitada');
        console.log('2. Esperar 24-48 horas para activación completa');
        console.log('3. Continuar maratón de calentamiento');
        console.log('4. Verificar permisos de IAM');
    }
    
    return {
        billing: billingEnabled,
        apis: vertexAccess,
        vertexAI: vertexWorking,
        marathon: marathonStatus,
        timestamp: new Date().toISOString()
    };
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { 
    checkBillingWithGCloud, 
    checkAndEnableAPIs, 
    checkVertexAIAccess, 
    testSimpleVertexAI,
    main 
}; 