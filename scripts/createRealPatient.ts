/**
 * Script para crear un paciente real y visitas clínicas en Supabase
 * 
 * Este script puede ejecutarse en modo simulación o conectarse realmente
 * a Supabase para crear datos.
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'cross-fetch';

// Configuración de si queremos simular o realmente conectar
const SIMULATION_MODE = true; // Cambiar a false para realmente conectar a Supabase

// Configuración de Supabase
const supabaseUrl = 'https://mchyxyaegsbwodengr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHl4eXVhZWdzYndvZGVuZ3IiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMDUwODE0NSwiZXhwIjoyMDI2MDg0MTQ1fQ';

// Configurar fetch para Node.js
let supabase;
if (!SIMULATION_MODE) {
  global.fetch = fetch;
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// IDs de usuario
const PATIENT_USER_ID = 'paciente@aiduxcare.com';
const PROFESSIONAL_USER_ID = 'demo@aiduxcare.com';

/**
 * Versión simulada que no se conecta a Supabase pero muestra todos los pasos
 */
async function runSimulation() {
  console.log('🚀 SIMULANDO creación de datos clínicos (NO se está conectando a Supabase)...');
  
  // 1. Simular búsqueda de profesional
  console.log(`Buscando profesional con email: ${PROFESSIONAL_USER_ID}...`);
  const professionalId = uuidv4();
  console.log(`✅ ID de profesional encontrado: ${professionalId}`);
  
  // 2. Simular búsqueda de usuario paciente
  console.log(`Buscando usuario paciente con email: ${PATIENT_USER_ID}...`);
  const patientUserId = uuidv4();
  console.log(`✅ ID de usuario paciente encontrado: ${patientUserId}`);
  
  // 3. Simular creación del paciente
  const patientId = uuidv4();
  console.log(`Creando paciente Andrea Bultó (29 años)...`);
  console.log(`✅ Paciente creado con ID: ${patientId}`);
  
  // 4. Simular creación de visita inicial
  const initialVisitId = uuidv4();
  const initialVisitDate = new Date();
  initialVisitDate.setDate(initialVisitDate.getDate() - 7); // 7 días atrás
  
  console.log(`Creando visita inicial (fecha: ${initialVisitDate.toISOString()})...`);
  console.log(`✅ Visita inicial creada con ID: ${initialVisitId}`);
  
  // 5. Simular creación de formulario clínico para visita inicial
  const initialFormId = uuidv4();
  console.log('Creando formulario SOAP para visita inicial...');
  console.log(`✅ Formulario clínico creado con ID: ${initialFormId}`);
  
  // 6. Simular creación de visita de seguimiento
  const followUpVisitId = uuidv4();
  const followUpVisitDate = new Date(); // Fecha actual
  
  console.log(`Creando visita de seguimiento (fecha: ${followUpVisitDate.toISOString()})...`);
  console.log(`✅ Visita de seguimiento creada con ID: ${followUpVisitId}`);
  
  // 7. Simular creación de formulario borrador para seguimiento
  const followUpFormId = uuidv4();
  console.log('Creando formulario SOAP borrador para visita de seguimiento...');
  console.log(`✅ Formulario borrador creado con ID: ${followUpFormId}`);
  
  // 8. Simular creación de registro de auditoría
  const auditLogId = uuidv4();
  console.log('Creando registro de auditoría...');
  console.log(`✅ Registro de auditoría creado con ID: ${auditLogId}`);
  
  // Resumen final
  console.log('\n🏥 SIMULACIÓN de datos clínicos reales completada:');
  console.log(`- Paciente: Andrea Bultó (ID: ${patientId})`);
  console.log(`- Visita inicial (${initialVisitDate.toLocaleDateString()}): ${initialVisitId}`);
  console.log(`- Visita de seguimiento (${followUpVisitDate.toLocaleDateString()}): ${followUpVisitId}`);
  console.log('\nDetalle del caso clínico:');
  console.log('-----------------------------');
  console.log('Primera visita: Paciente de 29 años que acude por dolor lumbo-cervical de moderada');
  console.log('intensidad, de características mecánicas, que aumenta con los movimientos y mejora');
  console.log('con el reposo. No refiere traumatismos previos. No presenta irradiación ni parestesias.');
  console.log('\nExploración física:');
  console.log('- Columna cervical: Movilidad conservada pero dolorosa en la extensión.');
  console.log('- Columna lumbar: Dolor a la palpación de apófisis espinosas L4-L5.');
  console.log('- Contractura paravertebral bilateral. Test de Lasègue negativo bilateral.');
  console.log('\nDiagnóstico:');
  console.log('Dolor lumbo-cervical de origen mecánico sin signos de gravedad,');
  console.log('probablemente relacionado con posturas ergonómicamente incorrectas y sedentarismo laboral.');
  console.log('\nPlan:');
  console.log('1. Recomendaciones ergonómicas y posturales');
  console.log('2. Ejercicios de fortalecimiento de musculatura paravertebral');
  console.log('3. Paracetamol 1g/8h si dolor');
  console.log('4. Control en 2 semanas para valorar evolución');
  console.log('\nVisita de seguimiento:');
  console.log('Paciente que acude a revisión. Refiere mejora parcial del dolor cervical,');
  console.log('pero persistencia del dolor lumbar, especialmente al final de la jornada laboral.');
  console.log('Ha implementado algunas de las recomendaciones ergonómicas y realiza los ejercicios diariamente.');
  console.log('\nNOTA: Esta ha sido una SIMULACIÓN. Para crear datos reales, cambia SIMULATION_MODE a false');
  console.log('      y asegúrate de configurar correctamente las credenciales de Supabase.');
}

/**
 * Versión real que se conecta a Supabase
 */
async function createRealData() {
  try {
    console.log('🚀 Iniciando creación de datos clínicos reales en Supabase...');
    
    // 1. Buscar el ID del usuario profesional
    const { data: professionalData, error: professionalError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', PROFESSIONAL_USER_ID)
      .single();
    
    if (professionalError) {
      throw new Error(`Error al buscar el profesional: ${professionalError.message}`);
    }
    
    const professionalId = professionalData.id;
    console.log(`✅ ID de profesional encontrado: ${professionalId}`);
    
    // 2. Buscar el ID del usuario paciente
    const { data: patientUserData, error: patientUserError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', PATIENT_USER_ID)
      .single();
    
    if (patientUserError) {
      throw new Error(`Error al buscar el usuario paciente: ${patientUserError.message}`);
    }
    
    const patientUserId = patientUserData.id;
    console.log(`✅ ID de usuario paciente encontrado: ${patientUserId}`);
    
    // 3. Crear el paciente en la tabla de pacientes
    const patientId = uuidv4();
    const { error: createPatientError } = await supabase
      .from('patients')
      .insert([{
        id: patientId,
        name: 'Andrea Bultó',
        age: 29,
        gender: 'female',
        insurance_id: 'ASEG-12345',
        user_id: patientUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (createPatientError) {
      throw new Error(`Error al crear el paciente: ${createPatientError.message}`);
    }
    
    console.log(`✅ Paciente creado con ID: ${patientId}`);
    
    // 4. Crear visitas clínicas para este paciente
    // Visita inicial de primera evaluación (ya realizada)
    const initialVisitId = uuidv4();
    const initialVisitDate = new Date();
    initialVisitDate.setDate(initialVisitDate.getDate() - 7); // 7 días atrás
    
    const { error: createVisitError } = await supabase
      .from('visits')
      .insert([{
        id: initialVisitId,
        professional_id: professionalId,
        patient_id: patientId,
        date: initialVisitDate.toISOString(),
        status: 'completed',
        notes: 'Primera evaluación por dolor lumbo-cervical de origen mecánico',
        created_at: initialVisitDate.toISOString(),
        updated_at: initialVisitDate.toISOString()
      }]);
    
    if (createVisitError) {
      throw new Error(`Error al crear la visita inicial: ${createVisitError.message}`);
    }
    
    console.log(`✅ Visita inicial creada con ID: ${initialVisitId}`);
    
    // 5. Crear formulario clínico SOAP para la visita inicial
    const initialFormContent = {
      subjective: 'Paciente de 29 años que acude por dolor lumbo-cervical de moderada intensidad, de características mecánicas, que aumenta con los movimientos y mejora con el reposo. Refiere inicio paulatino hace aproximadamente 3 semanas coincidiendo con cambio de puesto de trabajo que requiere mantener posturas sedentes por periodos prolongados. No refiere traumatismos previos. No presenta irradiación ni parestesias. No síntomas de alarma.',
      objective: 'Exploración física:\n- Columna cervical: Movilidad conservada pero dolorosa en la extensión. No signos radiculares.\n- Columna lumbar: Dolor a la palpación de apófisis espinosas L4-L5. Contractura paravertebral bilateral. Test de Lasègue negativo bilateral.\n- Exploración neurológica de MMII: Normal.\n- Constantes: TA 120/80 mmHg, FC 72 lpm, Tª 36.5°C.',
      assessment: 'Dolor lumbo-cervical de origen mecánico sin signos de gravedad, probablemente relacionado con posturas ergonómicamente incorrectas y sedentarismo laboral.',
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
    
    console.log(`✅ Formulario clínico creado para la visita inicial`);
    
    // 6. Crear visita de seguimiento (actual)
    const followUpVisitId = uuidv4();
    const followUpVisitDate = new Date(); // Fecha actual
    
    const { error: createFollowUpVisitError } = await supabase
      .from('visits')
      .insert([{
        id: followUpVisitId,
        professional_id: professionalId,
        patient_id: patientId,
        date: followUpVisitDate.toISOString(),
        status: 'in_progress',
        notes: 'Visita de seguimiento por dolor lumbo-cervical',
        created_at: followUpVisitDate.toISOString(),
        updated_at: followUpVisitDate.toISOString()
      }]);
    
    if (createFollowUpVisitError) {
      throw new Error(`Error al crear la visita de seguimiento: ${createFollowUpVisitError.message}`);
    }
    
    console.log(`✅ Visita de seguimiento creada con ID: ${followUpVisitId}`);
    
    // 7. Crear formulario inicial para la visita de seguimiento (en borrador)
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
    
    // Crear registros de auditoría para las acciones
    const auditLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      user_id: 'system',
      event_type: 'patient.create',
      details: JSON.stringify({
        patient_id: patientId,
        professional_id: professionalId,
        description: 'Creación de paciente real para caso clínico controlado'
      }),
      visit_id: followUpVisitId,
      created_at: new Date().toISOString()
    };
    
    const { error: createAuditLogError } = await supabase
      .from('audit_logs')
      .insert([auditLog]);
    
    if (createAuditLogError) {
      throw new Error(`Error al crear el registro de auditoría: ${createAuditLogError.message}`);
    }
    
    console.log(`✅ Registro de auditoría creado`);
    
    console.log('\n🏥 Datos clínicos reales creados correctamente:');
    console.log(`- Paciente: Andrea Bultó (ID: ${patientId})`);
    console.log(`- Visita inicial: ${initialVisitId}`);
    console.log(`- Visita de seguimiento: ${followUpVisitId}`);
    console.log('\nPuede acceder a estos datos utilizando:');
    console.log(`- Usuario profesional: ${PROFESSIONAL_USER_ID}`);
    console.log(`- Usuario paciente: ${PATIENT_USER_ID}`);
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

// Función principal
(async () => {
  if (SIMULATION_MODE) {
    await runSimulation();
  } else {
    await createRealData();
  }
})(); 