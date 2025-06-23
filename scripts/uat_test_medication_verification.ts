import { clinicalAssistantService, MedicationAdministration, MedicationPrescription, ProfessionalContext } from '../src/services/ClinicalAssistantService';

// Contexto de enfermero
const nurseContext: ProfessionalContext = {
  role: 'NURSE',
  country: 'CHILE',
  state: 'METROPOLITANA',
  specializations: ['Cuidados Intensivos'],
  certifications: ['ACLS', 'BLS'],
  licenseNumber: 'ENF-12345'
};

// Prescripciones médicas
const prescriptions: MedicationPrescription[] = [
  {
    id: 'presc-1',
    medicationName: 'Paracetamol',
    dosage: '500mg',
    route: 'ORAL',
    frequency: 'Cada 8 horas',
    prescribedBy: 'Dr. García',
    prescribedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    patientId: 'patient-1',
    indication: 'Dolor y fiebre',
    startDate: new Date().toISOString(),
    status: 'ACTIVE',
    notes: 'Tomar con alimentos'
  },
  {
    id: 'presc-2',
    medicationName: 'Amoxicilina',
    dosage: '500mg',
    route: 'ORAL',
    frequency: 'Cada 12 horas',
    prescribedBy: 'Dr. García',
    prescribedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    patientId: 'patient-1',
    indication: 'Infección respiratoria',
    startDate: new Date().toISOString(),
    status: 'ACTIVE'
  }
];

// Casos de administración
const testCases = [
  {
    name: "Administración Correcta",
    administration: {
      id: 'admin-1',
      medicationName: 'Paracetamol',
      dosage: '500mg',
      route: 'ORAL' as const,
      frequency: 'Cada 8 horas',
      administeredBy: 'Enf. María',
      administeredAt: new Date().toISOString(),
      patientId: 'patient-1',
      prescriptionId: 'presc-1',
      status: 'ADMINISTERED' as const,
      notes: 'Paciente toleró bien'
    } as MedicationAdministration
  },
  {
    name: "Dosis Incorrecta",
    administration: {
      id: 'admin-2',
      medicationName: 'Amoxicilina',
      dosage: '1000mg',
      route: 'ORAL' as const,
      frequency: 'Cada 12 horas',
      administeredBy: 'Enf. María',
      administeredAt: new Date().toISOString(),
      patientId: 'patient-1',
      prescriptionId: 'presc-2',
      status: 'ADMINISTERED' as const,
      notes: 'Error en dosis'
    } as MedicationAdministration
  }
];

async function testMedicationVerification() {
  console.log('🧪 TEST DE VERIFICACIÓN DE ADMINISTRACIÓN DE MEDICAMENTOS');
  console.log('='.repeat(70));

  for (const testCase of testCases) {
    console.log(`\n📋 CASO: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    const prescription = prescriptions.find(p => p.id === testCase.administration.prescriptionId);
    
    if (prescription) {
      const result = clinicalAssistantService.verifyMedicationAdministration(
        testCase.administration,
        prescription,
        nurseContext
      );
      
      console.log(`✅ Cumplimiento: ${result.isCompliant ? 'SÍ' : 'NO'}`);
      console.log(`🚨 Severidad: ${result.severity}`);
      
      if (result.discrepancies.length > 0) {
        console.log('❌ Discrepancias:');
        result.discrepancies.forEach(d => console.log(`   - ${d}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('⚠️ Advertencias:');
        result.warnings.forEach(w => console.log(`   - ${w}`));
      }
      
      if (result.recommendations.length > 0) {
        console.log('💡 Recomendaciones:');
        result.recommendations.forEach(r => console.log(`   - ${r}`));
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Test de verificación de medicamentos completado.');
}

testMedicationVerification(); 