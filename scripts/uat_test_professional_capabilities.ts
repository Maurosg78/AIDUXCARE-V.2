import { clinicalAssistantService, ClinicalEntity, Patient, ProfessionalContext } from '../src/services/ClinicalAssistantService';

const testContexts: ProfessionalContext[] = [
  {
    role: 'PHYSIOTHERAPIST',
    country: 'CHILE',
    state: 'METROPOLITANA',
    specializations: ['Traumatología', 'Neurología'],
    certifications: ['Punción Seca'],
    licenseNumber: 'KINE-12345'
  },
  {
    role: 'PHYSIOTHERAPIST',
    country: 'USA',
    state: 'CALIFORNIA',
    specializations: ['Orthopedic'],
    certifications: ['Manual Therapy'],
    licenseNumber: 'PT-67890'
  },
  {
    role: 'PHYSICIAN',
    country: 'CHILE',
    state: 'VALPARAISO',
    specializations: ['Medicina Interna'],
    certifications: ['Ecocardiografía'],
    licenseNumber: 'MED-11111'
  },
  {
    role: 'NURSE',
    country: 'USA',
    state: 'TEXAS',
    specializations: ['Critical Care'],
    certifications: ['ACLS', 'BLS'],
    licenseNumber: 'RN-22222'
  }
];

const testActions = [
  'prescribe_medication',
  'order_exams',
  'create_exercise_program',
  'dry_needling',
  'manual_therapy'
];

async function testProfessionalCapabilities() {
  console.log('🧪 TEST DE CAPACIDADES PROFESIONALES Y RESTRICCIONES GEOGRÁFICAS');
  console.log('='.repeat(80));

  for (const context of testContexts) {
    console.log(`\n👨‍⚕️ PROFESIONAL: ${context.role} en ${context.country}${context.state ? `, ${context.state}` : ''}`);
    console.log('='.repeat(60));
    
    // Obtener capacidades
    const capabilities = clinicalAssistantService.getCapabilitiesForContext(context);
    
    console.log('📋 CAPACIDADES:');
    console.log(`   - Prescribir medicamentos: ${capabilities.canPrescribeMedications ? '✅' : '❌'}`);
    console.log(`   - Ordenar exámenes: ${capabilities.canOrderExams ? '✅' : '❌'}`);
    console.log(`   - Crear programas de ejercicio: ${capabilities.canCreateExercisePrograms ? '✅' : '❌'}`);
    console.log(`   - Terapia manual: ${capabilities.canPerformManualTherapy ? '✅' : '❌'}`);
    console.log(`   - Punción seca: ${capabilities.canPerformDryNeedling ? '✅' : '❌'}`);
    console.log(`   - Acupuntura: ${capabilities.canPerformAcupuncture ? '✅' : '❌'}`);
    console.log(`   - Procedimientos invasivos: ${capabilities.canPerformInvasiveProcedures ? '✅' : '❌'}`);
    
    console.log('\n🚫 RESTRICCIONES:');
    capabilities.restrictions.forEach(restriction => {
      console.log(`   - ${restriction}`);
    });
    
    if (capabilities.requiredSupervision) {
      console.log('\n👥 SUPERVISIÓN REQUERIDA:');
      capabilities.requiredSupervision.forEach(supervisor => {
        console.log(`   - ${supervisor}`);
      });
    }
    
    console.log('\n🔍 VERIFICACIÓN DE ACCIONES:');
    for (const action of testActions) {
      const result = clinicalAssistantService.canPerformAction(action, context);
      console.log(`   - ${action}: ${result.allowed ? '✅' : '❌'} - ${result.reason}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Test de capacidades profesionales completado.');
}

testProfessionalCapabilities(); 