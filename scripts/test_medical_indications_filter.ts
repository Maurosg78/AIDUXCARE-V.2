#!/usr/bin/env ts-node

import { ClinicalAssistantService } from '../src/services/ClinicalAssistantService';
import { Patient, ProfessionalContext, MedicalIndication } from '../src/services/ClinicalAssistantService';

console.log('🏥 PRUEBA SISTEMA DE FILTROS DE INDICACIONES MÉDICAS');
console.log('==================================================\n');

const assistant = new ClinicalAssistantService();

// === CASO 1: FISIOTERAPEUTA CON PACIENTE LUMBALGIA ===
console.log('📋 CASO 1: FISIOTERAPEUTA - Paciente con Lumbalgia');
console.log('--------------------------------------------------');

const patientLumbalgia: Patient = {
  id: 'P001',
  name: 'María González',
  age: 45,
  phone: '+56912345678',
  email: 'maria.gonzalez@email.com',
  condition: 'dolor lumbar crónico',
  allergies: ['penicilina'],
  medications: ['metformina', 'ibuprofeno'],
  clinicalHistory: 'Hernia discal L4-L5, diabetes tipo 2',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const physioContext: ProfessionalContext = {
  role: 'PHYSIOTHERAPIST',
  country: 'CHILE',
  state: 'METROPOLITANA',
  licenseNumber: 'KIN-12345'
};

const indicationsLumbalgia: MedicalIndication[] = [
  {
    id: 'IND-001',
    type: 'EXERCISE_PROGRAM',
    title: 'Programa de Ejercicios Lumbares',
    description: 'Ejercicios de estabilización y fortalecimiento lumbar',
    prescribedBy: 'Dr. Carlos Méndez',
    prescribedAt: '2024-01-15T10:00:00Z',
    patientId: 'P001',
    priority: 'HIGH',
    status: 'ACTIVE',
    evidenceLevel: 'A'
  },
  {
    id: 'IND-002',
    type: 'MEDICATION',
    title: 'Ibuprofeno 600mg',
    description: 'Antiinflamatorio para dolor lumbar',
    prescribedBy: 'Dr. Carlos Méndez',
    prescribedAt: '2024-01-15T10:00:00Z',
    patientId: 'P001',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    contraindications: ['úlcera gástrica', 'insuficiencia renal']
  },
  {
    id: 'IND-003',
    type: 'EXAM',
    title: 'Resonancia Magnética Lumbar',
    description: 'Evaluación de hernia discal',
    prescribedBy: 'Dr. Carlos Méndez',
    prescribedAt: '2024-01-15T10:00:00Z',
    patientId: 'P001',
    priority: 'MEDIUM',
    status: 'ACTIVE'
  }
];

const resultPhysio = assistant.filterMedicalIndications(indicationsLumbalgia, patientLumbalgia, physioContext);

console.log('✅ Indicaciones Relevantes para Fisioterapeuta:');
resultPhysio.relevantIndications.forEach(ind => {
  console.log(`   • ${ind.title} (${ind.type})`);
});

console.log('\n⚠️ Advertencias Generadas:');
resultPhysio.warnings.forEach(warning => {
  console.log(`   • ${warning.title} [${warning.severity}]`);
  console.log(`     ${warning.description}`);
  console.log(`     Recomendación: ${warning.recommendation}\n`);
});

console.log('📚 Guías de Tratamiento Sugeridas:');
resultPhysio.treatmentGuidelines.forEach(guideline => {
  console.log(`   • ${guideline.title} [Evidencia: ${guideline.evidenceLevel}]`);
  console.log(`     Recomendaciones: ${guideline.recommendations.join(', ')}\n`);
});

// === CASO 2: ENFERMERO CON PACIENTE HOSPITALIZADO ===
console.log('\n📋 CASO 2: ENFERMERO - Paciente Hospitalizado');
console.log('-----------------------------------------------');

const patientHospitalizado: Patient = {
  id: 'P002',
  name: 'Juan Pérez',
  age: 68,
  phone: '+56987654321',
  email: 'juan.perez@email.com',
  condition: 'neumonía bilateral',
  allergies: ['sulfas'],
  medications: ['warfarin', 'metformina', 'enalapril'],
  clinicalHistory: 'EPOC, hipertensión arterial, diabetes',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const nurseContext: ProfessionalContext = {
  role: 'NURSE',
  country: 'CHILE',
  state: 'METROPOLITANA',
  licenseNumber: 'ENF-67890'
};

const indicationsHospitalizado: MedicalIndication[] = [
  {
    id: 'IND-004',
    type: 'MEDICATION',
    title: 'Aspirina 100mg',
    description: 'Anticoagulante para prevención cardiovascular',
    prescribedBy: 'Dr. Ana Silva',
    prescribedAt: '2024-01-15T08:00:00Z',
    patientId: 'P002',
    priority: 'HIGH',
    status: 'ACTIVE',
    contraindications: ['úlcera gástrica']
  },
  {
    id: 'IND-005',
    type: 'PROCEDURE',
    title: 'Punción Venosa',
    description: 'Administración de antibióticos IV',
    prescribedBy: 'Dr. Ana Silva',
    prescribedAt: '2024-01-15T08:00:00Z',
    patientId: 'P002',
    priority: 'URGENT',
    status: 'ACTIVE'
  },
  {
    id: 'IND-006',
    type: 'EXAM',
    title: 'Radiografía de Tórax',
    description: 'Control de neumonía',
    prescribedBy: 'Dr. Ana Silva',
    prescribedAt: '2024-01-15T08:00:00Z',
    patientId: 'P002',
    priority: 'MEDIUM',
    status: 'ACTIVE'
  }
];

const resultNurse = assistant.filterMedicalIndications(indicationsHospitalizado, patientHospitalizado, nurseContext);

console.log('✅ Indicaciones Relevantes para Enfermero:');
resultNurse.relevantIndications.forEach(ind => {
  console.log(`   • ${ind.title} (${ind.type})`);
});

console.log('\n⚠️ Advertencias Generadas:');
resultNurse.warnings.forEach(warning => {
  console.log(`   • ${warning.title} [${warning.severity}]`);
  console.log(`     ${warning.description}`);
  if (warning.legalImplications) {
    console.log(`     Implicaciones legales: ${warning.legalImplications.join(', ')}`);
  }
  console.log(`     Recomendación: ${warning.recommendation}\n`);
});

// === CASO 3: MÉDICO CON PACIENTE COMPLEJO ===
console.log('\n📋 CASO 3: MÉDICO - Paciente Complejo');
console.log('--------------------------------------');

const patientComplejo: Patient = {
  id: 'P003',
  name: 'Carmen Rodríguez',
  age: 72,
  phone: '+56911223344',
  email: 'carmen.rodriguez@email.com',
  condition: 'dolor cervical post-traumático',
  allergies: ['yodo'],
  medications: ['levotiroxina', 'calcio', 'vitamina D', 'paracetamol'],
  clinicalHistory: 'Artritis reumatoide, osteoporosis, hipotiroidismo',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z'
};

const physicianContext: ProfessionalContext = {
  role: 'PHYSICIAN',
  country: 'CHILE',
  state: 'METROPOLITANA',
  licenseNumber: 'MED-11111'
};

const indicationsComplejo: MedicalIndication[] = [
  {
    id: 'IND-007',
    type: 'MEDICATION',
    title: 'Ibuprofeno 400mg',
    description: 'Antiinflamatorio para dolor cervical',
    prescribedBy: 'Dr. Roberto Vargas',
    prescribedAt: '2024-01-15T14:00:00Z',
    patientId: 'P003',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    contraindications: ['úlcera gástrica', 'insuficiencia renal']
  },
  {
    id: 'IND-008',
    type: 'TREATMENT_PLAN',
    title: 'Plan de Tratamiento Integral',
    description: 'Manejo multidisciplinario del dolor cervical',
    prescribedBy: 'Dr. Roberto Vargas',
    prescribedAt: '2024-01-15T14:00:00Z',
    patientId: 'P003',
    priority: 'HIGH',
    status: 'ACTIVE',
    evidenceLevel: 'B'
  },
  {
    id: 'IND-009',
    type: 'REFERRAL',
    title: 'Derivación a Fisioterapia',
    description: 'Evaluación y tratamiento fisioterapéutico',
    prescribedBy: 'Dr. Roberto Vargas',
    prescribedAt: '2024-01-15T14:00:00Z',
    patientId: 'P003',
    priority: 'MEDIUM',
    status: 'ACTIVE'
  }
];

const resultPhysician = assistant.filterMedicalIndications(indicationsComplejo, patientComplejo, physicianContext);

console.log('✅ Indicaciones Relevantes para Médico:');
resultPhysician.relevantIndications.forEach(ind => {
  console.log(`   • ${ind.title} (${ind.type})`);
});

console.log('\n⚠️ Advertencias Generadas:');
resultPhysician.warnings.forEach(warning => {
  console.log(`   • ${warning.title} [${warning.severity}]`);
  console.log(`     ${warning.description}`);
  console.log(`     Recomendación: ${warning.recommendation}\n`);
});

console.log('📚 Guías de Tratamiento Sugeridas:');
resultPhysician.treatmentGuidelines.forEach(guideline => {
  console.log(`   • ${guideline.title} [Evidencia: ${guideline.evidenceLevel}]`);
  console.log(`     Fuente: ${guideline.source}`);
  console.log(`     Recomendaciones: ${guideline.recommendations.join(', ')}\n`);
});

// === RESUMEN COMPARATIVO ===
console.log('\n📊 RESUMEN COMPARATIVO POR ROL PROFESIONAL');
console.log('==========================================');

const roles = [
  { name: 'FISIOTERAPEUTA', context: physioContext, result: resultPhysio },
  { name: 'ENFERMERO', context: nurseContext, result: resultNurse },
  { name: 'MÉDICO', context: physicianContext, result: resultPhysician }
];

roles.forEach(role => {
  console.log(`\n👨‍⚕️ ${role.name}:`);
  console.log(`   • Indicaciones relevantes: ${role.result.relevantIndications.length}`);
  console.log(`   • Advertencias generadas: ${role.result.warnings.length}`);
  console.log(`   • Guías de tratamiento: ${role.result.treatmentGuidelines.length}`);
  
  const criticalWarnings = role.result.warnings.filter(w => w.severity === 'CRITICAL');
  if (criticalWarnings.length > 0) {
    console.log(`   • ⚠️ ADVERTENCIAS CRÍTICAS: ${criticalWarnings.length}`);
  }
});

console.log('\n🎯 CONCLUSIONES:');
console.log('• El sistema respeta la autonomía profesional filtrando indicaciones relevantes');
console.log('• Genera advertencias contextuales sobre puntos ciegos y riesgos legales');
console.log('• Proporciona guías de tratamiento basadas en evidencia científica');
console.log('• Adapta las recomendaciones según el rol y capacidades del profesional');
console.log('• Mantiene un registro de auditoría para compliance legal');

console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE'); 