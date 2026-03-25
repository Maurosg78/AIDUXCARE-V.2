import { parseVertexResponse, validateClinicalSchema } from "../responseParser";
const DEFAULT_TESTS = [];
const DEFAULT_RESULT = {
    motivo_consulta: "",
    hallazgos_clinicos: [],
    hallazgos_relevantes: [],
    contexto_ocupacional: [],
    contexto_psicosocial: [],
    medicacion_actual: [],
    antecedentes_medicos: [],
    diagnosticos_probables: [],
    red_flags: [],
    yellow_flags: [],
    evaluaciones_fisicas_sugeridas: DEFAULT_TESTS,
    derivacion_recomendada: "",
    pronostico_estimado: "",
    notas_seguridad: "",
    riesgo_legal: "low",
    biopsychosocial_psychological: [],
    biopsychosocial_social: [],
    biopsychosocial_occupational: [],
    biopsychosocial_protective: [],
    biopsychosocial_functional_limitations: [],
    biopsychosocial_patient_strengths: [],
};
const ensureStringArray = (value) => {
    if (!value)
        return [];
    if (Array.isArray(value))
        return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === "string")
        return value.trim() ? [value.trim()] : [];
    return [];
};
const mapExposure = (value) => {
    if (typeof value !== "string")
        return "low";
    const normalized = value.toLowerCase();
    if (normalized.includes("moderate") || normalized.includes("medium"))
        return "moderate";
    if (normalized.includes("high") || normalized.includes("alto"))
        return "high";
    return "low";
};
const buildTestJustification = (item) => {
    const pieces = [];
    if (item.rationale)
        pieces.push(item.rationale);
    if (item.region)
        pieces.push(`Region: ${item.region}`);
    if (item.evidence_level)
        pieces.push(`Evidence: ${String(item.evidence_level).toLowerCase()}`);
    return pieces.join(" · ").trim();
};
const mapPhysicalTests = (tests) => {
    if (!Array.isArray(tests))
        return [];
    return tests
        .map((item) => {
        if (!item)
            return null;
        if (typeof item === "string")
            return item;
        if (typeof item !== "object")
            return null;
        const name = item.name || item.test || "Physical test";
        const sensitivityValue = item.sensibilidad !== undefined ? item.sensibilidad : item.sensitivity;
        const specificityValue = item.especificidad !== undefined ? item.especificidad : item.specificity;
        const sensitivityIsUnknown = sensitivityValue === "unknown" || sensitivityValue === null || sensitivityValue === undefined;
        const specificityIsUnknown = specificityValue === "unknown" || specificityValue === null || specificityValue === undefined;
        const sensitivity = sensitivityIsUnknown ? undefined : sensitivityValue;
        const specificity = specificityIsUnknown ? undefined : specificityValue;
        const hasSource = item.source && item.source !== "unknown" && item.source !== "clinical_reasoning";
        const hasScores = sensitivity !== undefined || specificity !== undefined;
        if (hasScores && !hasSource) {
            return {
                test: name,
                sensibilidad: undefined,
                especificidad: undefined,
                sensitivity: undefined,
                specificity: undefined,
                sensitivityQualitative: undefined,
                specificityQualitative: undefined,
                objetivo: item.objective || item.objetivo || item.indicacion || "",
                contraindicado_si: item.contraindicado_si || item.contraindications || "",
                justificacion: buildTestJustification(item),
                evidencia: item.evidence_level || item.evidencia,
                evidence_level: item.evidence_level || item.evidencia,
                source: "unknown",
                rationale: item.rationale || item.justificacion || buildTestJustification(item),
                region: item.region || undefined,
            };
        }
        return {
            test: name,
            sensibilidad: sensitivity,
            especificidad: specificity,
            sensitivity,
            specificity,
            sensitivityQualitative: typeof sensitivity === "string" ? sensitivity : undefined,
            specificityQualitative: typeof specificity === "string" ? specificity : undefined,
            objetivo: item.objective || item.objetivo || item.indicacion || "",
            contraindicado_si: item.contraindicado_si || item.contraindications || "",
            justificacion: buildTestJustification(item),
            evidencia: item.evidence_level || item.evidencia,
            evidence_level: item.evidence_level || item.evidencia,
            source: item.source || "unknown",
            rationale: item.rationale || item.justificacion || buildTestJustification(item),
            region: item.region || undefined,
        };
    })
        .filter(Boolean);
};
const cleanFlags = (flags) => {
    return ensureStringArray(flags).filter((flag) => {
        const normalized = flag.toLowerCase();
        return Boolean(flag) && !normalized.includes("none identified") && !normalized.includes("no critical");
    });
};
const mergeUnique = (...arrays) => {
    const set = new Set();
    arrays.flat().filter(Boolean).forEach((item) => set.add(item));
    return Array.from(set);
};
const normalizeKey = (value) => {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
};
const FLAG_MARKER_REGEX = /red\s*flag|yellow\s*flag|bandera\s*roja|bandera\s*amarilla|red_flags|yellow_flags/i;
const transformArray = (items, transformText) => {
    return items.map((item) => transformText(item));
};
const mapStructuredPayload = (payload, transformText) => {
    const alerts = payload.medicolegal_alerts ?? {};
    const highlights = payload.conversation_highlights ?? {};
    const biopsych = payload.biopsychosocial_factors ?? {};
    const redFlags = transformArray(cleanFlags(ensureStringArray(alerts.red_flags)), transformText);
    const yellowFlags = transformArray(cleanFlags(ensureStringArray(alerts.yellow_flags)), transformText);
    const alertNotes = transformArray(ensureStringArray(alerts.alert_notes), transformText);
    const psychological = transformArray(ensureStringArray(biopsych.psychological), transformText);
    const social = transformArray(ensureStringArray(biopsych.social), transformText);
    const occupational = transformArray(ensureStringArray(biopsych.occupational), transformText);
    const protective = transformArray(ensureStringArray(biopsych.protective_factors), transformText);
    const functionalLimitations = transformArray(ensureStringArray(biopsych.functional_limitations), transformText);
    const patientStrengths = transformArray(ensureStringArray(biopsych.patient_strengths), transformText);
    const legalEmployment = transformArray(ensureStringArray(biopsych.legal_or_employment_context), transformText);
    const combinedYellow = mergeUnique(yellowFlags, legalEmployment);
    const psychosocialContext = mergeUnique(psychological, social, protective);
    const keyFindingsRaw = transformArray(ensureStringArray(highlights.key_findings), transformText);
    const flagTextSet = new Set([...redFlags, ...combinedYellow].map(normalizeKey));
    const filteredKeyFindings = keyFindingsRaw.filter((item) => {
        const normalized = normalizeKey(item);
        if (FLAG_MARKER_REGEX.test(item))
            return false;
        if (flagTextSet.has(normalized))
            return false;
        return true;
    });
    return {
        motivo_consulta: transformText(String(highlights.chief_complaint || highlights.summary || "")),
        hallazgos_clinicos: filteredKeyFindings,
        hallazgos_relevantes: [],
        contexto_ocupacional: occupational,
        contexto_psicosocial: psychosocialContext,
        medicacion_actual: transformArray(ensureStringArray(highlights.medications), transformText),
        antecedentes_medicos: transformArray(ensureStringArray(highlights.medical_history), transformText),
        diagnosticos_probables: [],
        red_flags: redFlags,
        yellow_flags: combinedYellow,
        evaluaciones_fisicas_sugeridas: mapPhysicalTests(payload.recommended_physical_tests),
        derivacion_recomendada: "",
        pronostico_estimado: "",
        notas_seguridad: alertNotes.join(" • "),
        riesgo_legal: mapExposure(alerts.legal_exposure),
        biopsychosocial_psychological: psychological,
        biopsychosocial_social: social,
        biopsychosocial_occupational: occupational,
        biopsychosocial_protective: protective,
        biopsychosocial_functional_limitations: functionalLimitations,
        biopsychosocial_patient_strengths: patientStrengths,
    };
};
const mapLegacyPayload = (payload, transformText) => {
    const clone = { ...DEFAULT_RESULT };
    clone.motivo_consulta = transformText(String(payload?.motivo_consulta || ""));
    clone.hallazgos_clinicos = transformArray(ensureStringArray(payload?.hallazgos_clinicos), transformText);
    clone.hallazgos_relevantes = ensureStringArray(payload?.hallazgos_relevantes) || clone.hallazgos_clinicos;
    clone.contexto_ocupacional = transformArray(ensureStringArray(payload?.contexto_ocupacional), transformText);
    clone.contexto_psicosocial = transformArray(ensureStringArray(payload?.contexto_psicosocial), transformText);
    clone.medicacion_actual = transformArray(ensureStringArray(payload?.medicacion_actual), transformText);
    clone.antecedentes_medicos = transformArray(ensureStringArray(payload?.antecedentes_medicos), transformText);
    clone.diagnosticos_probables = ensureStringArray(payload?.diagnosticos_probables);
    clone.red_flags = transformArray(cleanFlags(ensureStringArray(payload?.red_flags)), transformText);
    clone.yellow_flags = transformArray(cleanFlags(ensureStringArray(payload?.yellow_flags)), transformText);
    clone.evaluaciones_fisicas_sugeridas = mapPhysicalTests(payload?.evaluaciones_fisicas_sugeridas);
    clone.derivacion_recomendada = String(payload?.derivacion_recomendada || "");
    clone.pronostico_estimado = String(payload?.pronostico_estimado || "");
    clone.notas_seguridad = transformText(String(payload?.notas_seguridad || ""));
    clone.riesgo_legal = mapExposure(payload?.riesgo_legal);
    return clone;
};
export const identityTextTransform = (value) => value;
export const normalizeVertexResponseWithTransform = (raw, transformText) => {
    if (raw?.candidates?.[0]?.content?.parts) {
        const part = raw.candidates[0].content.parts.find((item) => item?.text || item?.functionCall?.args?.text || item?.inlineData);
        if (part?.text)
            return normalizeVertexResponseWithTransform(part.text, transformText);
        if (part?.functionCall?.args?.text)
            return normalizeVertexResponseWithTransform(part.functionCall.args.text, transformText);
    }
    if (raw?.output_text)
        return normalizeVertexResponseWithTransform(raw.output_text, transformText);
    if (raw?.candidates?.[0]?.content?.parts?.[0]?.text)
        return normalizeVertexResponseWithTransform(raw.candidates[0].content.parts[0].text, transformText);
    const parseResult = parseVertexResponse(raw);
    if (!parseResult.success)
        throw new Error(parseResult.error || "Failed to parse Vertex AI response");
    const parsed = parseResult.data ?? {};
    if (validateClinicalSchema(parsed))
        return mapStructuredPayload(parsed, transformText);
    return mapLegacyPayload(parsed, transformText);
};
