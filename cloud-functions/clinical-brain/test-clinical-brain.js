const axios = require('axios');

// Configuración del test
const CLINICAL_BRAIN_URL = 'https://us-central1-aiduxcare-stt-20250706.cloudfunctions.net/clinicalBrain/analyze';
const TEST_TRANSCRIPTION = `Paciente refiere dolor en hombro derecho de 3 semanas de evolución. Menciona que el dolor comenzó después de cargar unas cajas pesadas en el trabajo. Describe el dolor como punzante, de intensidad 7/10, que empeora con movimientos por encima de la cabeza y mejora con reposo. También refiere rigidez matutina que dura aproximadamente 30 minutos.

El paciente trabaja en una bodega donde frecuentemente levanta objetos pesados. Menciona que ha tenido episodios similares antes, pero nunca tan intensos. No recuerda haber tenido trauma directo en el hombro. Refiere que el dolor a veces se irradia hacia el brazo, pero no hay entumecimiento ni hormigueo.

Ha estado tomando ibuprofeno 400mg cada 8 horas con alivio parcial del dolor. No ha realizado fisioterapia previa para este problema. Menciona que duerme del lado izquierdo porque el dolor aumenta cuando se acuesta sobre el hombro afectado.

Durante la evaluación física, se observa postura antálgica con el hombro derecho ligeramente elevado. Presenta limitación del rango de movimiento en flexión (120°) y abducción (90°). El test de Neer es positivo, así como el test de Hawkins. Hay dolor a la palpación en el tubérculo mayor del húmero.

La fuerza muscular está disminuida en abducción (4/5) y rotación externa (4/5). No hay signos neurológicos evidentes. El paciente muestra buena colaboración durante la evaluación y comprende las instrucciones.

Se explica al paciente que probablemente presenta un síndrome de pinzamiento subacromial. Se inicia tratamiento con técnicas de terapia manual, ejercicios de movilidad y se programa seguimiento en una semana. Se recomienda evitar actividades que involucren elevación del brazo por encima de la cabeza y continuar con antiinflamatorios según indicación médica.`;

async function testClinicalBrain() {
    console.log('🧠 INICIANDO PRIMERA PRUEBA DEL CEREBRO CLÍNICO');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
        console.log('📝 Preparando request...');
        
        const requestData = {
            transcription: TEST_TRANSCRIPTION,
            specialty: 'physiotherapy',
            sessionType: 'initial'
        };
        
        console.log(`📊 Datos del request:`);
        console.log(`   - Specialty: ${requestData.specialty}`);
        console.log(`   - Session Type: ${requestData.sessionType}`);
        console.log(`   - Transcription Length: ${requestData.transcription.length} caracteres`);
        console.log('');
        
        console.log('🚀 Enviando request al Cerebro Clínico...');
        
        const response = await axios.post(CLINICAL_BRAIN_URL, requestData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 segundos timeout
        });
        
        const processingTime = Date.now() - startTime;
        
        console.log('✅ RESPUESTA RECIBIDA');
        console.log(`⏱️  Tiempo de procesamiento: ${processingTime}ms`);
        console.log('=' .repeat(60));
        console.log('');
        
        console.log('📄 RESPUESTA JSON COMPLETA:');
        console.log('=' .repeat(60));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('=' .repeat(60));
        
        // Análisis básico de la respuesta
        if (response.data.success) {
            const analysis = response.data.analysis;
            console.log('');
            console.log('📊 ANÁLISIS RÁPIDO:');
            console.log(`   - Advertencias: ${analysis.warnings?.length || 0}`);
            console.log(`   - Sugerencias: ${analysis.suggestions?.length || 0}`);
            console.log(`   - Calidad SOAP: ${analysis.soap_analysis?.overall_quality || 'N/A'}`);
            console.log(`   - Tiempo procesamiento: ${response.data.metadata?.processingTimeMs || 'N/A'}ms`);
        }
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        
        console.log('❌ ERROR EN LA PRUEBA');
        console.log(`⏱️  Tiempo transcurrido: ${processingTime}ms`);
        console.log('=' .repeat(60));
        
        if (error.response) {
            console.log('📄 RESPUESTA DE ERROR:');
            console.log(JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.log('🔌 ERROR DE CONEXIÓN:');
            console.log('No se pudo conectar al servicio. ¿Está ejecutándose en localhost:8080?');
        } else {
            console.log('⚠️  ERROR DESCONOCIDO:');
            console.log(error.message);
        }
        
        console.log('=' .repeat(60));
    }
}

// Ejecutar la prueba
testClinicalBrain(); 