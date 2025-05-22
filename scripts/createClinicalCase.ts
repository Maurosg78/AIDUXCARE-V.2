/**
 * Script para crear un caso clínico real y trazable para Andrea Bultó
 * Incluye: creación de paciente, visita, EMR, sugerencias IA y audio
 * 
 * IMPORTANTE: Este script debe ejecutarse con las variables de entorno correctas
 * para asegurar la conexión real a Supabase y la trazabilidad completa.
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import readline from 'readline';

// Verificar variables de entorno necesarias
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`❌ Error: Faltan variables de entorno: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// IDs de usuario para asociar en el caso clínico
const PATIENT_EMAIL = 'paciente@aiduxcare.com';
const PROFESSIONAL_EMAIL = 'demo@aiduxcare.com';

// Crear una interfaz para leer la entrada del usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función principal asíncrona
async function main() {
  try {
    console.log('🚀 Iniciando creación del caso clínico real de Andrea Bultó');
    console.log('-------------------------------------------------------');
    
    // 1. Autenticar al profesional para obtener su sesión (para RLS)
    console.log('1️⃣ Autenticando al profesional...');
    
    console.log(`   Iniciando sesión como ${PROFESSIONAL_EMAIL}...`);

    // Preguntar por la contraseña del profesional
    const professionalPassword = await askQuestion('   Ingrese la contraseña del profesional: ');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: PROFESSIONAL_EMAIL,
      password: professionalPassword
    });
    
    if (signInError) {
      throw new Error(`Error al iniciar sesión como profesional: ${signInError.message}`);
    }
    
    console.log(`✅ Sesión iniciada correctamente como ${PROFESSIONAL_EMAIL}`);
    
    // 2. Buscar el ID del usuario profesional
    console.log('\n2️⃣ Obteniendo información del profesional y del paciente...');
    
    const { data: professionalData, error: professionalError } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('email', PROFESSIONAL_EMAIL)
      .single();
    
    if (professionalError) {
      throw new Error(`Error al buscar el perfil del profesional: ${professionalError.message}`);
    }
    
    const professionalId = professionalData.id;
    const professionalName = professionalData.full_name;
    console.log(`✅ Profesional encontrado: ${professionalName} (ID: ${professionalId})`);
    
    // 3. Buscar si ya existe o crear usuario para el paciente 
    console.log(`   Buscando perfil del paciente (${PATIENT_EMAIL})...`);
    
    const { data: existingPatientUser, error: patientUserError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', PATIENT_EMAIL)
      .single();
    
    let patientUserId;
    const patientEmail = PATIENT_EMAIL;
    
    if (patientUserError && patientUserError.code !== 'PGRST116') {
      throw new Error(`Error al buscar el usuario paciente: ${patientUserError.message}`);
    }
    
    if (!existingPatientUser) {
      console.log(`   No se encontró perfil para ${PATIENT_EMAIL}, se usará un ID simulado`);
      // El paciente aparentemente no existe en el sistema actual, usaremos un ID generado
      patientUserId = uuidv4();
      console.log(`   ID generado para el paciente: ${patientUserId}`);
    } else {
      patientUserId = existingPatientUser.id;
      console.log(`✅ Perfil de paciente encontrado con ID: ${patientUserId}`);
    }
    
    // 4. Crear el paciente Andrea Bultó en la tabla de pacientes
    console.log('\n3️⃣ Creando el paciente Andrea Bultó...');
    
    // Verificar si ya existe un paciente con este nombre
    const { data: existingPatients, error: existingPatientError } = await supabase
      .from('patients')
      .select('id, name')
      .ilike('name', '%Andrea Bultó%');
    
    if (existingPatientError) {
      throw new Error(`Error al verificar pacientes existentes: ${existingPatientError.message}`);
    }
    
    if (existingPatients && existingPatients.length > 0) {
      console.log(`⚠️ Se encontraron pacientes existentes con nombre similar:`);
      existingPatients.forEach((p, idx) => {
        console.log(`   ${idx+1}. ${p.name} (ID: ${p.id})`);
      });
      
      const shouldContinue = await askQuestion('   ¿Desea continuar de todos modos? (s/n): ');
      if (shouldContinue.toLowerCase() !== 's') {
        console.log('❌ Operación cancelada por el usuario');
        return;
      }
    }
    
    // Crear o actualizar el paciente
    const patientId = uuidv4();
    const patientData = {
      id: patientId,
      name: 'Andrea Bultó',
      age: 29,
      gender: 'female',
      insurance_id: 'ASEG-29381',
      user_id: patientUserId, // Vinculamos con la cuenta del paciente
      email: 'andrea@aiduxcare.test', // Email propio, diferente al de acceso
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: createPatientError } = await supabase
      .from('patients')
      .insert([patientData]);
    
    if (createPatientError) {
      throw new Error(`Error al crear el paciente: ${createPatientError.message}`);
    }
    
    console.log(`✅ Paciente creado con ID: ${patientId}`);
    
    // 5. Crear visita clínica inicial para este paciente
    console.log('\n4️⃣ Creando visita clínica inicial...');
    
    const initialVisitId = uuidv4();
    const initialVisitDate = new Date();
    initialVisitDate.setDate(initialVisitDate.getDate() - 7); // 7 días atrás
    
    const visitData = {
      id: initialVisitId,
      professional_id: professionalId,
      patient_id: patientId,
      date: initialVisitDate.toISOString(),
      status: 'completed',
      notes: 'Primera evaluación por dolor lumbo-cervical de origen mecánico',
      created_at: initialVisitDate.toISOString(),
      updated_at: initialVisitDate.toISOString(),
      type: 'evaluación inicial'
    };
    
    const { error: createVisitError } = await supabase
      .from('visits')
      .insert([visitData]);
    
    if (createVisitError) {
      throw new Error(`Error al crear la visita: ${createVisitError.message}`);
    }
    
    console.log(`✅ Visita inicial creada con ID: ${initialVisitId}`);
    
    // 6. Crear formulario clínico SOAP para la visita inicial
    console.log('\n5️⃣ Creando formulario clínico SOAP...');
    
    const initialFormContent = {
      subjective: 'Paciente de 29 años que acude por dolor lumbo-cervical de moderada intensidad, de características mecánicas, que aumenta con los movimientos y mejora con el reposo. Refiere inicio paulatino hace aproximadamente 3 semanas coincidiendo con cambio de puesto de trabajo que requiere mantener posturas sedentes por periodos prolongados. No refiere traumatismos previos. No presenta irradiación ni parestesias. No síntomas de alarma.',
      objective: 'Exploración física: Dolor a la palpación de apófisis espinosas L4-L5 y C5-C7. Contractura paravertebral bilateral. Limitación a la flexo-extensión cervical en grado leve. No signos radiculares. No déficits sensitivos ni motores. Reflejos osteotendinosos normales y simétricos.',
      assessment: 'Dolor lumbo-cervical de origen mecánico sin signos de gravedad, probablemente relacionado con postura laboral inadecuada y estrés asociado al cambio de puesto.',
      plan: '1. Recomendaciones ergonómicas y posturales\n2. Ejercicios de fortalecimiento de musculatura paravertebral\n3. Paracetamol 1g/8h si dolor\n4. Control en 2 semanas para valorar evolución',
      notes: 'Se recomienda a la paciente que realice pausas activas durante su jornada laboral. Se le han facilitado infografías con ejercicios específicos para realizar en el trabajo.'
    };
    
    const { error: createFormError } = await supabase
      .from('clinical_forms')
      .insert([{
        id: uuidv4(),
        visit_id: initialVisitId,
        professional_id: professionalId,
        patient_id: patientId,
        form_type: 'SOAP',
        content: JSON.stringify(initialFormContent),
        status: 'completed',
        created_at: initialVisitDate.toISOString(),
        updated_at: initialVisitDate.toISOString()
      }]);
    
    if (createFormError) {
      throw new Error(`Error al crear el formulario clínico: ${createFormError.message}`);
    }
    
    console.log(`✅ Formulario clínico SOAP creado para la visita inicial`);
    
    // 7. Crear una segunda visita (actual) de seguimiento
    console.log('\n6️⃣ Creando visita de seguimiento actual...');
    
    const followUpVisitId = uuidv4();
    const followUpVisitDate = new Date(); // Fecha actual
    
    const followUpVisitData = {
      id: followUpVisitId,
      professional_id: professionalId,
      patient_id: patientId,
      date: followUpVisitDate.toISOString(),
      status: 'in_progress',
      notes: 'Visita de seguimiento por dolor lumbo-cervical',
      created_at: followUpVisitDate.toISOString(),
      updated_at: followUpVisitDate.toISOString(),
      type: 'seguimiento'
    };
    
    const { error: createFollowUpVisitError } = await supabase
      .from('visits')
      .insert([followUpVisitData]);
    
    if (createFollowUpVisitError) {
      throw new Error(`Error al crear la visita de seguimiento: ${createFollowUpVisitError.message}`);
    }
    
    console.log(`✅ Visita de seguimiento creada con ID: ${followUpVisitId}`);
    
    // 8. Crear formulario clínico borrador para la visita de seguimiento
    console.log('\n7️⃣ Creando formulario clínico borrador para seguimiento...');
    
    const followUpFormContent = {
      subjective: 'Paciente que acude a revisión. Refiere mejora parcial del dolor cervical, pero persistencia del dolor lumbar, especialmente al final de la jornada laboral. Ha implementado algunas de las recomendaciones ergonómicas y realiza los ejercicios diariamente.',
      objective: '',
      assessment: '',
      plan: '',
      notes: ''
    };
    
    const { error: createFollowUpFormError } = await supabase
      .from('clinical_forms')
      .insert([{
        id: uuidv4(),
        visit_id: followUpVisitId,
        professional_id: professionalId,
        patient_id: patientId,
        form_type: 'SOAP',
        content: JSON.stringify(followUpFormContent),
        status: 'draft',
        created_at: followUpVisitDate.toISOString(),
        updated_at: followUpVisitDate.toISOString()
      }]);
    
    if (createFollowUpFormError) {
      throw new Error(`Error al crear el formulario para la visita de seguimiento: ${createFollowUpFormError.message}`);
    }
    
    console.log(`✅ Formulario borrador creado para la visita de seguimiento`);
    
    // 9. Crear sugerencia IA para el seguimiento
    console.log('\n8️⃣ Agregando sugerencia IA para el seguimiento...');
    
    const aiSuggestionId = uuidv4();
    const aiSuggestionData = {
      id: aiSuggestionId,
      visit_id: followUpVisitId,
      form_id: null, // No está asociado a un formulario específico
      content: 'Considerando la persistencia del dolor lumbar a pesar de realizar ejercicios posturales, recomendaría valorar derivación a fisioterapia para tratamiento manual específico y refuerzo de ejercicios terapéuticos.',
      type: 'suggestion',
      status: 'pending', 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'clinical-agent',
      confidence: 0.92,
      metadata: JSON.stringify({
        source_context: 'visita_seguimiento',
        reasoning: 'persistence_of_symptoms',
        approved_by: null,
        rejected_reason: null
      })
    };
    
    const { error: createSuggestionError } = await supabase
      .from('ai_suggestions')
      .insert([aiSuggestionData]);
    
    if (createSuggestionError) {
      throw new Error(`Error al crear la sugerencia IA: ${createSuggestionError.message}`);
    }
    
    console.log(`✅ Sugerencia IA creada con ID: ${aiSuggestionId}`);
    
    // 10. Agregar transcripción de audio validada
    console.log('\n9️⃣ Agregando transcripción de audio validada...');
    
    const audioTranscriptionId = uuidv4();
    const audioTranscriptionData = {
      id: audioTranscriptionId,
      visit_id: followUpVisitId,
      content: JSON.stringify([
        {
          id: uuidv4(),
          text: '🔊 La paciente refiere haber notado mejoría durante la primera semana con los ejercicios, pero luego el dolor lumbar ha vuelto a aumentar coincidiendo con mayor carga de trabajo.',
          speaker: 'professional',
          timestamp: new Date().toISOString(),
          confidence: 0.94,
          status: 'approved',
          user_id: professionalId
        },
        {
          id: uuidv4(),
          text: '(Inaudible)',
          speaker: 'patient',
          timestamp: new Date().toISOString(),
          confidence: 0.32,
          status: 'rejected',
          user_id: professionalId,
          rejection_reason: 'low_quality'
        }
      ]),
      status: 'partially_approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: JSON.stringify({
        duration_seconds: 156,
        audio_format: 'simulated',
        device: 'test_microphone'
      })
    };
    
    const { error: createTranscriptionError } = await supabase
      .from('audio_transcriptions')
      .insert([audioTranscriptionData]);
    
    if (createTranscriptionError) {
      throw new Error(`Error al crear la transcripción de audio: ${createTranscriptionError.message}`);
    }
    
    console.log(`✅ Transcripción de audio creada con ID: ${audioTranscriptionId}`);
    
    // 11. Registrar eventos en la tabla de auditoría
    console.log('\n🔟 Registrando eventos en el log de auditoría...');
    
    const auditEvents = [
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        user_id: professionalId,
        event_type: 'patient.create',
        details: JSON.stringify({
          patient_id: patientId,
          professional_id: professionalId,
          description: 'Creación de paciente Andrea Bultó'
        }),
        visit_id: initialVisitId,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        user_id: professionalId,
        event_type: 'visit.create',
        details: JSON.stringify({
          visit_id: initialVisitId,
          patient_id: patientId,
          professional_id: professionalId,
          description: 'Primera evaluación médica'
        }),
        visit_id: initialVisitId,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        user_id: professionalId,
        event_type: 'form.create',
        details: JSON.stringify({
          form_type: 'SOAP',
          visit_id: initialVisitId,
          patient_id: patientId,
          professional_id: professionalId,
          description: 'Documentación inicial de visita'
        }),
        visit_id: initialVisitId,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        user_id: professionalId,
        event_type: 'visit.create',
        details: JSON.stringify({
          visit_id: followUpVisitId,
          patient_id: patientId,
          professional_id: professionalId,
          description: 'Visita de seguimiento'
        }),
        visit_id: followUpVisitId,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        user_id: professionalId,
        event_type: 'ai.suggestion',
        details: JSON.stringify({
          suggestion_id: aiSuggestionId,
          visit_id: followUpVisitId,
          patient_id: patientId,
          professional_id: professionalId,
          description: 'Sugerencia IA generada'
        }),
        visit_id: followUpVisitId,
        created_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        user_id: professionalId,
        event_type: 'audio.transcription',
        details: JSON.stringify({
          transcription_id: audioTranscriptionId,
          visit_id: followUpVisitId,
          patient_id: patientId,
          professional_id: professionalId,
          description: 'Transcripción de audio validada parcialmente'
        }),
        visit_id: followUpVisitId,
        created_at: new Date().toISOString()
      }
    ];
    
    const { error: createAuditLogError } = await supabase
      .from('audit_logs')
      .insert(auditEvents);
    
    if (createAuditLogError) {
      throw new Error(`Error al crear registros de auditoría: ${createAuditLogError.message}`);
    }
    
    console.log(`✅ ${auditEvents.length} eventos registrados en el log de auditoría`);
    
    // 12. Registrar métricas en Langfuse simulado (o tabla local)
    console.log('\n1️⃣1️⃣ Registrando métricas para análisis...');
    
    const metricsEvents = [
      {
        id: uuidv4(),
        event_name: 'case_created',
        user_id: professionalId,
        patient_id: patientId,
        visit_id: initialVisitId,
        metadata: JSON.stringify({
          case_type: 'new_patient',
          specialty: 'general_medicine',
          diagnosis: 'dolor_lumbo_cervical'
        }),
        timestamp: new Date().toISOString()
      },
      {
        id: uuidv4(),
        event_name: 'ai_suggestion_generated',
        user_id: professionalId,
        patient_id: patientId,
        visit_id: followUpVisitId,
        metadata: JSON.stringify({
          suggestion_id: aiSuggestionId,
          suggestion_type: 'clinical_recommendation',
          confidence: 0.92,
          generation_time_ms: 456
        }),
        timestamp: new Date().toISOString()
      },
      {
        id: uuidv4(),
        event_name: 'audio_transcription_processed',
        user_id: professionalId,
        patient_id: patientId,
        visit_id: followUpVisitId,
        metadata: JSON.stringify({
          transcription_id: audioTranscriptionId,
          duration_seconds: 156,
          segments_count: 2,
          approved_segments: 1,
          rejected_segments: 1
        }),
        timestamp: new Date().toISOString()
      }
    ];
    
    const { error: createMetricsError } = await supabase
      .from('usage_metrics')
      .insert(metricsEvents);
    
    if (createMetricsError) {
      throw new Error(`Error al registrar métricas: ${createMetricsError.message}`);
    }
    
    console.log(`✅ ${metricsEvents.length} eventos de métricas registrados`);
    
    // Resumen final
    console.log('\n✨ CASO CLÍNICO CREADO CORRECTAMENTE ✨');
    console.log('-------------------------------------------------------');
    console.log('Datos del caso:');
    console.log(`- Paciente: Andrea Bultó (ID: ${patientId})`);
    console.log(`  Email: andrea@aiduxcare.test | Usuario: ${patientUserId}`);
    console.log(`- Profesional: ${professionalName} (ID: ${professionalId})`);
    console.log(`- Visita inicial: ${initialVisitId} (hace 7 días)`);
    console.log(`- Visita seguimiento: ${followUpVisitId} (actual)`);
    console.log('-------------------------------------------------------');
    console.log('Próximos pasos:');
    console.log('1. Accede al sistema como profesional (demo@aiduxcare.com)');
    console.log('2. Ve a la visita de seguimiento y aprueba la sugerencia IA');
    console.log('3. Completa el formulario SOAP borrador');
    console.log('4. Accede como paciente (paciente@aiduxcare.com) para ver sus datos');
    console.log('-------------------------------------------------------');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    // Cerrar el readline
    rl.close();
  }
}

// Función para preguntar al usuario
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Ejecutar la función principal
main(); 