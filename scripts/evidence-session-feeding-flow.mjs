#!/usr/bin/env node
/**
 * Evidencia del flujo de alimentación de sesiones (backend).
 *
 * Casos ficticios con datos concretos. Ejecutar:
 *   node scripts/evidence-session-feeding-flow.mjs
 *
 * No usa Firestore ni mocks. Aplica el mismo mapeo que clinicalStateService
 * (snapshot → baselineSOAP) para ver exactamente qué entra al follow-up.
 * Luego validar en UI con pacientes creados en Aidux.
 */

const SOAP_INITIAL_FICTICIO = {
  subjective:
    'Paciente refiere dolor lumbar de 2 semanas, sin irradiación. Mejoría con reposo.',
  objective:
    'ROM lumbar limitado en flexión. Prueba de elevación pierna recta negativa. Sin déficit neurológico.',
  assessment: 'Lumbalgia mecánica aguda, sin banderas rojas.',
  plan: 'Interventions: MT lumbar, movilización. Home Exercises: estiramiento isquiotibiales 2x/día. Goals: retorno a ADL en 2 semanas. Follow-up: 1 semana.',
  precautions: 'Evitar flexión repetida y carga pesada hasta revaloración.',
};

function buildSnapshotFromSOAP(soap) {
  return {
    primaryAssessment: soap.assessment ?? '',
    keyFindings: [soap.subjective ?? '', soap.objective ?? ''].filter(Boolean),
    precautions: soap.precautions ? [soap.precautions] : undefined,
    planSummary: soap.plan ?? '',
  };
}

function mapSnapshotToBaselineSOAP(snapshot, baselineId, sourceSoapId, createdAt) {
  return {
    subjective: (snapshot.keyFindings?.[0] ?? ''),
    objective: (snapshot.keyFindings?.slice(1) ?? []).join('\n') ?? '',
    assessment: snapshot.primaryAssessment ?? '',
    plan: snapshot.planSummary ?? '',
    encounterId: sourceSoapId ?? baselineId,
    date: createdAt,
  };
}

function main() {
  console.log('=== EVIDENCIA: Flujo de alimentación Initial Assessment → Follow-up ===\n');

  const snapshot = buildSnapshotFromSOAP(SOAP_INITIAL_FICTICIO);
  const createdAt = new Date('2026-01-20T10:00:00Z');
  const baselineSOAP = mapSnapshotToBaselineSOAP(
    snapshot,
    'baseline-ficticio-001',
    'session-ia-001',
    createdAt
  );

  console.log('1) SOAP ficticio de Initial Assessment (cerrado):');
  console.log(JSON.stringify(SOAP_INITIAL_FICTICIO, null, 2));
  console.log('');

  console.log('2) Snapshot persistido en clinical_baselines (createBaseline):');
  console.log(JSON.stringify(snapshot, null, 2));
  console.log('');

  console.log('3) baselineSOAP que recibe el Follow-up (getClinicalState → baselineSOAP):');
  console.log(JSON.stringify({ ...baselineSOAP, date: baselineSOAP.date.toISOString() }, null, 2));
  console.log('');

  console.log('4) Evidencia de mapeo:');
  console.log('   subjective  = keyFindings[0]     =>', baselineSOAP.subjective.slice(0, 50) + '...');
  console.log('   objective   = keyFindings[1..]   =>', baselineSOAP.objective.slice(0, 50) + '...');
  console.log('   assessment  = primaryAssessment  =>', baselineSOAP.assessment);
  console.log('   plan        = planSummary        =>', baselineSOAP.plan.slice(0, 60) + '...');
  console.log('');

  console.log('5) Gap conocido: precautions en snapshot NO entran a baselineSOAP');
  console.log('   snapshot.precautions =', snapshot.precautions);
  console.log('   baselineSOAP tiene keys:', Object.keys(baselineSOAP).join(', '));
  console.log('   (precautions no está en baselineSOAP; no se envía al prompt de follow-up)');
  console.log('');

  console.log('=== Siguiente paso: validar en UI con pacientes creados en Aidux ===');
}

main();
