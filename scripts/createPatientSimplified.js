/**
 * Script para crear un paciente real y visitas clínicas en Supabase
 * Versión simplificada en JavaScript puro
 */

// Configuramos fetch global antes de importar Supabase
const fetch = require('cross-fetch');
global.fetch = fetch;

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configuración de Supabase
const supabaseUrl = 'https://mchyxyaegsbwodengr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHl4eXVhZWdzYndvZGVuZ3IiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxMDUwODE0NSwiZXhwIjoyMDI2MDg0MTQ1fQ';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { 
    persistSession: false,
    autoRefreshToken: false
  }
});

// IDs de usuario para asociar en el caso clínico
const PATIENT_USER_ID = 'paciente@aiduxcare.com';
const PROFESSIONAL_USER_ID = 'demo@aiduxcare.com';
let professionalId, patientUserId;

// Función principal
async function main() {
  try {
    console.log('LAUNCH: Iniciando creación de datos clínicos reales...');
    
    // Información simulada para evitar consultas a la base de datos
    // En un entorno real estas IDs vendrían de la base de datos
    professionalId = uuidv4();
    patientUserId = uuidv4();
    console.log(`SUCCESS: Usando ID de profesional simulado: ${professionalId}`);
    console.log(`SUCCESS: Usando ID de usuario paciente simulado: ${patientUserId}`);
    
    // Crear el paciente
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
    
    console.log(`SUCCESS: Paciente creado con ID: ${patientId}`);
    
    // Crear visita inicial
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
    
    console.log(`SUCCESS: Visita inicial creada con ID: ${initialVisitId}`);
    
    // Crear formulario clínico
    const initialFormContent = {
      subjective: 'Paciente de 29 años que acude por dolor lumbo-cervical de moderada intensidad, de características mecánicas, que aumenta con los movimientos y mejora con el reposo.',
      objective: 'Exploración física: Dolor a la palpación de apófisis espinosas L4-L5. Contractura paravertebral bilateral.',
      assessment: 'Dolor lumbo-cervical de origen mecánico sin signos de gravedad.',
      plan: '1. Recomendaciones ergonómicas y posturales\n2. Paracetamol 1g/8h si dolor\n3. Control en 2 semanas',
      notes: 'Se recomienda realizar pausas activas durante la jornada laboral.'
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
    
    console.log(`SUCCESS: Formulario clínico creado para la visita inicial`);
    
    // Crear visita de seguimiento
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
    
    console.log(`SUCCESS: Visita de seguimiento creada con ID: ${followUpVisitId}`);
    
    // Crear formulario borrador para seguimiento
    const followUpFormContent = {
      subjective: 'Paciente que acude a revisión. Refiere mejora parcial del dolor cervical, pero persistencia del dolor lumbar.',
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
    
    console.log(`SUCCESS: Formulario borrador creado para la visita de seguimiento`);
    
    // Crear registro de auditoría
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
    
    console.log(`SUCCESS: Registro de auditoría creado`);
    
    // Resumen final
    console.log('\n🏥 Datos clínicos reales creados correctamente:');
    console.log(`- Paciente: Andrea Bultó (ID: ${patientId})`);
    console.log(`- Visita inicial: ${initialVisitId}`);
    console.log(`- Visita de seguimiento: ${followUpVisitId}`);
    
  } catch (error) {
    console.error('ERROR: ERROR:', error);
  }
}

// Ejecutar el script
main(); 