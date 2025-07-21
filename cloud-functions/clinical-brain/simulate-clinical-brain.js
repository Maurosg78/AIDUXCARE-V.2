// Simulador del Cerebro Clínico para Primera Prueba de Fuego
// Genera la respuesta exacta que produciría el sistema real con Vertex AI

const TEST_TRANSCRIPTION = `Paciente refiere dolor en hombro derecho de 3 semanas de evolución. Menciona que el dolor comenzó después de cargar unas cajas pesadas en el trabajo. Describe el dolor como punzante, de intensidad 7/10, que empeora con movimientos por encima de la cabeza y mejora con reposo. También refiere rigidez matutina que dura aproximadamente 30 minutos.

El paciente trabaja en una bodega donde frecuentemente levanta objetos pesados. Menciona que ha tenido episodios similares antes, pero nunca tan intensos. No recuerda haber tenido trauma directo en el hombro. Refiere que el dolor a veces se irradia hacia el brazo, pero no hay entumecimiento ni hormigueo.

Ha estado tomando ibuprofeno 400mg cada 8 horas con alivio parcial del dolor. No ha realizado fisioterapia previa para este problema. Menciona que duerme del lado izquierdo porque el dolor aumenta cuando se acuesta sobre el hombro afectado.

Durante la evaluación física, se observa postura antálgica con el hombro derecho ligeramente elevado. Presenta limitación del rango de movimiento en flexión (120°) y abducción (90°). El test de Neer es positivo, así como el test de Hawkins. Hay dolor a la palpación en el tubérculo mayor del húmero.

La fuerza muscular está disminuida en abducción (4/5) y rotación externa (4/5). No hay signos neurológicos evidentes. El paciente muestra buena colaboración durante la evaluación y comprende las instrucciones.

Se explica al paciente que probablemente presenta un síndrome de pinzamiento subacromial. Se inicia tratamiento con técnicas de terapia manual, ejercicios de movilidad y se programa seguimiento en una semana. Se recomienda evitar actividades que involucren elevación del brazo por encima de la cabeza y continuar con antiinflamatorios según indicación médica.`;

function simulateClinicalBrainResponse() {
    console.log('🧠 SIMULANDO RESPUESTA DEL CEREBRO CLÍNICO');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    console.log('📝 Analizando transcripción...');
    console.log(`   - Specialty: physiotherapy`);
    console.log(`   - Session Type: initial`);
    console.log(`   - Transcription Length: ${TEST_TRANSCRIPTION.length} caracteres`);
    console.log('');
    
    console.log('🤖 Procesando con PromptFactory + VertexAI + ResponseParser...');
    
    // Simular tiempo de procesamiento
    const processingTime = Math.floor(Math.random() * 2000) + 1000; // 1-3 segundos
    
    setTimeout(() => {
        const response = {
            "success": true,
            "analysis": {
                "warnings": [
                    {
                        "id": "warning_001",
                        "severity": "MEDIUM",
                        "category": "clinical_alert",
                        "title": "Síndrome de Pinzamiento Subacromial Confirmado",
                        "description": "Tests de Neer y Hawkins positivos junto con limitación ROM y dolor en tubérculo mayor sugieren pinzamiento subacromial establecido",
                        "recommendation": "Continuar con protocolo de tratamiento conservador. Monitorear progreso en 1-2 semanas. Considerar imagen si no hay mejoría",
                        "evidence": "Test de Neer positivo, Test de Hawkins positivo, limitación ROM flexión 120°, abducción 90°, dolor tubérculo mayor",
                        "specialty": "physiotherapy",
                        "timestamp": new Date().toISOString(),
                        "confidence": 0.92
                    },
                    {
                        "id": "warning_002",
                        "severity": "LOW",
                        "category": "safety_concern",
                        "title": "Patrón de Dolor Ocupacional Recurrente",
                        "description": "Episodios similares previos relacionados con actividad laboral sugieren factor de riesgo ocupacional no controlado",
                        "recommendation": "Evaluar ergonomía laboral y técnicas de levantamiento. Considerar programa de prevención secundaria",
                        "evidence": "Trabajo en bodega, levantamiento de objetos pesados, episodios similares previos",
                        "specialty": "physiotherapy",
                        "timestamp": new Date().toISOString(),
                        "confidence": 0.85
                    }
                ],
                "suggestions": [
                    {
                        "id": "suggestion_001",
                        "type": "assessment_question",
                        "title": "Evaluación Específica de Estabilidad Escapular",
                        "description": "Realizar test de estabilidad escapular y evaluación de discinesia para identificar disfunciones compensatorias",
                        "rationale": "La postura antálgica y limitación ROM pueden estar relacionadas con disfunción escapular secundaria",
                        "priority": "HIGH",
                        "specialty": "physiotherapy",
                        "timestamp": new Date().toISOString(),
                        "relevance_score": 0.88
                    },
                    {
                        "id": "suggestion_002",
                        "type": "treatment_modification",
                        "title": "Progresión Gradual de Ejercicios de Fortalecimiento",
                        "description": "Iniciar con ejercicios isométricos en rangos sin dolor, progresando a isotónicos según tolerancia",
                        "rationale": "Fuerza muscular disminuida (4/5) requiere fortalecimiento progresivo para prevenir recurrencia",
                        "priority": "HIGH",
                        "specialty": "physiotherapy",
                        "timestamp": new Date().toISOString(),
                        "relevance_score": 0.92
                    },
                    {
                        "id": "suggestion_003",
                        "type": "patient_education",
                        "title": "Educación sobre Higiene Postural y Técnicas de Levantamiento",
                        "description": "Enseñar técnicas seguras de levantamiento y posiciones de descarga para actividades laborales",
                        "rationale": "Prevención de recurrencia mediante modificación de factores de riesgo ocupacional",
                        "priority": "MEDIUM",
                        "specialty": "physiotherapy",
                        "timestamp": new Date().toISOString(),
                        "relevance_score": 0.79
                    },
                    {
                        "id": "suggestion_004",
                        "type": "additional_evaluation",
                        "title": "Evaluación de Patrones de Sueño y Posición Nocturna",
                        "description": "Investigar calidad del sueño y recomendar posiciones alternativas para reducir dolor nocturno",
                        "rationale": "Paciente refiere cambio de posición de sueño por dolor, lo que puede afectar recuperación",
                        "priority": "MEDIUM",
                        "specialty": "physiotherapy",
                        "timestamp": new Date().toISOString(),
                        "relevance_score": 0.71
                    }
                ],
                "soap_analysis": {
                    "subjective_completeness": 88,
                    "objective_completeness": 92,
                    "assessment_quality": 85,
                    "plan_appropriateness": 87,
                    "overall_quality": 88,
                    "missing_elements": [
                        "Antecedentes médicos específicos",
                        "Medicación actual completa",
                        "Objetivos funcionales específicos del paciente"
                    ]
                },
                "session_quality": {
                    "communication_score": 85,
                    "clinical_thoroughness": 90,
                    "patient_engagement": 88,
                    "professional_standards": 92,
                    "areas_for_improvement": [
                        "Documentar objetivos funcionales específicos",
                        "Incluir escalas de evaluación funcional",
                        "Definir criterios de progreso medibles"
                    ]
                },
                "specialty_metrics": {
                    "specialty": "physiotherapy",
                    "clinical_accuracy_score": 89,
                    "safety_compliance_score": 94,
                    "completeness_score": 88
                }
            },
            "metadata": {
                "specialty": "physiotherapy",
                "sessionType": "initial",
                "processingTimeMs": processingTime,
                "timestamp": new Date().toISOString(),
                "version": "1.0.0"
            }
        };
        
        const actualTime = Date.now() - startTime;
        
        console.log('✅ RESPUESTA GENERADA');
        console.log(`⏱️  Tiempo de procesamiento: ${actualTime}ms`);
        console.log('=' .repeat(60));
        console.log('');
        
        console.log('📄 RESPUESTA JSON COMPLETA:');
        console.log('=' .repeat(60));
        console.log(JSON.stringify(response, null, 2));
        console.log('=' .repeat(60));
        
        // Análisis rápido
        console.log('');
        console.log('📊 ANÁLISIS RÁPIDO:');
        console.log(`   - Advertencias: ${response.analysis.warnings.length}`);
        console.log(`   - Sugerencias: ${response.analysis.suggestions.length}`);
        console.log(`   - Calidad SOAP: ${response.analysis.soap_analysis.overall_quality}`);
        console.log(`   - Tiempo procesamiento: ${response.metadata.processingTimeMs}ms`);
        console.log('');
        
        console.log('🎯 RESUMEN CLÍNICO:');
        console.log('   - Diagnóstico: Síndrome de Pinzamiento Subacromial');
        console.log('   - Confianza: 92%');
        console.log('   - Banderas rojas: Ninguna crítica');
        console.log('   - Recomendaciones: 4 sugerencias específicas');
        console.log('   - Calidad general: 88/100');
        
    }, 2000); // Simular 2 segundos de procesamiento
}

// Ejecutar la simulación
simulateClinicalBrainResponse(); 