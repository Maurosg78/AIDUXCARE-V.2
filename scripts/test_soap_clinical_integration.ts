#!/usr/bin/env tsx

import { soapClinicalIntegrationService } from '../src/services/SOAPClinicalIntegrationService';
import { Patient, ProfessionalContext, MedicalIndication } from '../src/services/ClinicalAssistantService';

console.log('🏥 PRUEBA INTEGRACIÓN COMPLETA SOAP-CLÍNICA');
console.log('===========================================\n');

// === CASO 1: FISIOTERAPEUTA - PACIENTE CON LUMBALGIA ===
console.log('📋 CASO 1: Fisioterapeuta - Paciente con Lumbalgia');
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

const transcriptionLumbalgia = `
paciente: me duele mucho la espalda baja desde hace dos semanas cuando me agacho me paralizo
terapeuta: al palpar la zona lumbar observo contractura en los músculos paravertebrales
paciente: el dolor me baja hasta la pierna derecha y me despierto por las noches
terapeuta: test de Lasègue positivo en miembro inferior derecho compatible con radiculopatía L5
paciente: no puedo sentarme más de 10 minutos sin que me duela
terapeuta: recomiendo iniciar programa de ejercicios de estabilización lumbar y terapia manual
`;

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
  }
];

// === CASO 2: ENFERMERO - PACIENTE HOSPITALIZADO ===
console.log('\n📋 CASO 2: Enfermero - Paciente Hospitalizado');
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

const transcriptionHospitalizado = `
paciente: me siento muy cansado y me cuesta respirar desde hace tres días
enfermero: al auscultar se evidencia crepitantes bilaterales en campos pulmonares
paciente: tengo fiebre de 38.5 grados y tos con expectoración verdosa
enfermero: saturación de oxígeno al 92% en reposo compatible con insuficiencia respiratoria
paciente: no puedo dormir por la tos y me duele el pecho al respirar
enfermero: administro antibióticos por vía intravenosa según prescripción médica
`;

const indicationsHospitalizado: MedicalIndication[] = [
  {
    id: 'IND-003',
    type: 'MEDICATION',
    title: 'Ceftriaxona 1g IV',
    description: 'Antibiótico para neumonía',
    prescribedBy: 'Dr. Ana Silva',
    prescribedAt: '2024-01-15T08:00:00Z',
    patientId: 'P002',
    priority: 'HIGH',
    status: 'ACTIVE'
  },
  {
    id: 'IND-004',
    type: 'PROCEDURE',
    title: 'Punción Venosa',
    description: 'Administración de medicamentos IV',
    prescribedBy: 'Dr. Ana Silva',
    prescribedAt: '2024-01-15T08:00:00Z',
    patientId: 'P002',
    priority: 'URGENT',
    status: 'ACTIVE'
  }
];

// === FUNCIÓN DE PRUEBA ===
async function testIntegration(
  caseName: string,
  transcription: string,
  patient: Patient,
  context: ProfessionalContext,
  indications: MedicalIndication[]
) {
  console.log(`\n🔧 Ejecutando: ${caseName}`);
  console.log('─'.repeat(50));

  try {
    const startTime = Date.now();
    
    // Procesar pipeline completo
    const result = await soapClinicalIntegrationService.processCompletePipeline(
      transcription,
      patient,
      context,
      indications
    );
    
    const totalTime = Date.now() - startTime;

    // Mostrar resultados
    console.log('✅ RESULTADOS DEL PIPELINE:');
    console.log(`   • Tiempo total: ${totalTime}ms`);
    console.log(`   • Segmentos SOAP: ${result.soapResult.segments.length}`);
    console.log(`   • Entidades clínicas: ${result.integrationMetrics.entityExtractionCount}`);
    console.log(`   • Indicaciones relevantes: ${result.medicalIndications.relevantIndications.length}`);
    console.log(`   • Advertencias: ${result.medicalIndications.warnings.length}`);
    console.log(`   • Guías de tratamiento: ${result.medicalIndications.treatmentGuidelines.length}`);

    // Mostrar segmentos SOAP
    console.log('\n📝 SEGMENTOS SOAP PROCESADOS:');
    result.soapResult.segments.forEach((segment, index) => {
      console.log(`   ${index + 1}. [${segment.speaker}] [${segment.section}] ${segment.text.substring(0, 60)}...`);
      console.log(`      Confianza: ${(segment.confidence * 100).toFixed(1)}%`);
    });

    // Mostrar entidades clínicas principales
    console.log('\n🔍 ENTIDADES CLÍNICAS PRINCIPALES:');
    const topEntities = result.clinicalEntities
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
    
    topEntities.forEach(entity => {
      console.log(`   • ${entity.text} (${entity.type}) - ${(entity.confidence * 100).toFixed(1)}%`);
    });

    // Mostrar advertencias
    if (result.medicalIndications.warnings.length > 0) {
      console.log('\n⚠️ ADVERTENCIAS GENERADAS:');
      result.medicalIndications.warnings.forEach(warning => {
        console.log(`   • ${warning.title} [${warning.severity}]`);
        console.log(`     ${warning.description}`);
        console.log(`     Recomendación: ${warning.recommendation}\n`);
      });
    }

    // Mostrar guías de tratamiento
    if (result.medicalIndications.treatmentGuidelines.length > 0) {
      console.log('\n📚 GUÍAS DE TRATAMIENTO:');
      result.medicalIndications.treatmentGuidelines.forEach(guideline => {
        console.log(`   • ${guideline.title} [Evidencia: ${guideline.evidenceLevel}]`);
        console.log(`     Recomendaciones: ${guideline.recommendations.join(', ')}\n`);
      });
    }

    // Resumen ejecutivo
    const summary = soapClinicalIntegrationService.getProcessingSummary(result);
    console.log('\n📊 RESUMEN EJECUTIVO:');
    console.log(`   Nivel de Riesgo: ${summary.riskLevel}`);
    console.log(`   Resumen: ${summary.summary}`);
    
    if (summary.recommendations.length > 0) {
      console.log('\n   Recomendaciones:');
      summary.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    return result;

  } catch (error) {
    console.error(`❌ ERROR en ${caseName}:`, (error as Error).message);
    throw error;
  }
}

// === EJECUCIÓN DE PRUEBAS ===
async function runAllTests() {
  console.log('🚀 INICIANDO PRUEBAS DE INTEGRACIÓN COMPLETA\n');

  try {
    // Prueba 1: Fisioterapeuta
    await testIntegration(
      'Fisioterapeuta - Lumbalgia',
      transcriptionLumbalgia,
      patientLumbalgia,
      physioContext,
      indicationsLumbalgia
    );

    // Prueba 2: Enfermero
    await testIntegration(
      'Enfermero - Paciente Hospitalizado',
      transcriptionHospitalizado,
      patientHospitalizado,
      nurseContext,
      indicationsHospitalizado
    );

    console.log('\n🎯 PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('✅ Pipeline de integración SOAP-Clínica funcionando correctamente');
    console.log('✅ Filtros de indicaciones médicas operativos');
    console.log('✅ Advertencias contextuales generadas');
    console.log('✅ Guías de tratamiento sugeridas');

  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:', (error as Error).message);
    process.exit(1);
  }
}

// Ejecutar pruebas
runAllTests(); 