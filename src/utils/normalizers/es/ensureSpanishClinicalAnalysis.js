import { ensureSpanishClinicalText } from './ensureSpanishClinicalText';
const normalizeStringArray = (items) => {
    const safeItems = Array.isArray(items) ? items : [];
    const normalizedItems = safeItems.map((item) => {
        const normalizedItem = ensureSpanishClinicalText(String(item));
        return normalizedItem;
    });
    return normalizedItems;
};
const normalizePhysicalTests = (tests) => {
    const safeTests = Array.isArray(tests) ? tests : [];
    const normalizedTests = safeTests.map((test) => {
        if (!test || typeof test !== 'object') {
            return test;
        }
        const normalizedTest = { ...test };
        const testName = test.test ? ensureSpanishClinicalText(String(test.test)) : test.test;
        const objective = test.objetivo ? ensureSpanishClinicalText(String(test.objetivo)) : test.objetivo;
        const contraindications = test.contraindicado_si ? ensureSpanishClinicalText(String(test.contraindicado_si)) : test.contraindicado_si;
        const justification = test.justificacion ? ensureSpanishClinicalText(String(test.justificacion)) : test.justificacion;
        const rationale = test.rationale ? ensureSpanishClinicalText(String(test.rationale)) : test.rationale;
        const region = test.region ? ensureSpanishClinicalText(String(test.region)) : test.region;
        normalizedTest.test = testName;
        normalizedTest.objetivo = objective;
        normalizedTest.contraindicado_si = contraindications;
        normalizedTest.justificacion = justification;
        normalizedTest.rationale = rationale;
        normalizedTest.region = region;
        return normalizedTest;
    });
    return normalizedTests;
};
export const ensureSpanishClinicalAnalysis = (analysis) => {
    const normalizedAnalysis = { ...analysis };
    const chiefComplaint = ensureSpanishClinicalText(String(analysis.motivo_consulta || ''));
    const keyFindings = normalizeStringArray(analysis.hallazgos_clinicos);
    const relevantFindings = normalizeStringArray(analysis.hallazgos_relevantes);
    const occupationalContext = normalizeStringArray(analysis.contexto_ocupacional);
    const psychosocialContext = normalizeStringArray(analysis.contexto_psicosocial);
    const medications = normalizeStringArray(analysis.medicacion_actual);
    const medicalHistory = normalizeStringArray(analysis.antecedentes_medicos);
    const probableDiagnoses = normalizeStringArray(analysis.diagnosticos_probables);
    const redFlags = normalizeStringArray(analysis.red_flags);
    const yellowFlags = normalizeStringArray(analysis.yellow_flags);
    const treatmentPlan = normalizeStringArray(analysis.plan_tratamiento_sugerido);
    const referral = ensureSpanishClinicalText(String(analysis.derivacion_recomendada || ''));
    const prognosis = ensureSpanishClinicalText(String(analysis.pronostico_estimado || ''));
    const safetyNotes = ensureSpanishClinicalText(String(analysis.notas_seguridad || ''));
    const psychological = normalizeStringArray(analysis.biopsychosocial_psychological);
    const social = normalizeStringArray(analysis.biopsychosocial_social);
    const biopsychOccupational = normalizeStringArray(analysis.biopsychosocial_occupational);
    const protective = normalizeStringArray(analysis.biopsychosocial_protective);
    const functionalLimitations = normalizeStringArray(analysis.biopsychosocial_functional_limitations);
    const strengths = normalizeStringArray(analysis.biopsychosocial_patient_strengths);
    const physicalTests = normalizePhysicalTests(analysis.evaluaciones_fisicas_sugeridas);
    normalizedAnalysis.motivo_consulta = chiefComplaint;
    normalizedAnalysis.hallazgos_clinicos = keyFindings;
    normalizedAnalysis.hallazgos_relevantes = relevantFindings;
    normalizedAnalysis.contexto_ocupacional = occupationalContext;
    normalizedAnalysis.contexto_psicosocial = psychosocialContext;
    normalizedAnalysis.medicacion_actual = medications;
    normalizedAnalysis.antecedentes_medicos = medicalHistory;
    normalizedAnalysis.diagnosticos_probables = probableDiagnoses;
    normalizedAnalysis.red_flags = redFlags;
    normalizedAnalysis.yellow_flags = yellowFlags;
    normalizedAnalysis.plan_tratamiento_sugerido = treatmentPlan;
    normalizedAnalysis.derivacion_recomendada = referral;
    normalizedAnalysis.pronostico_estimado = prognosis;
    normalizedAnalysis.notas_seguridad = safetyNotes;
    normalizedAnalysis.biopsychosocial_psychological = psychological;
    normalizedAnalysis.biopsychosocial_social = social;
    normalizedAnalysis.biopsychosocial_occupational = biopsychOccupational;
    normalizedAnalysis.biopsychosocial_protective = protective;
    normalizedAnalysis.biopsychosocial_functional_limitations = functionalLimitations;
    normalizedAnalysis.biopsychosocial_patient_strengths = strengths;
    normalizedAnalysis.evaluaciones_fisicas_sugeridas = physicalTests;
    return normalizedAnalysis;
};
