import type { ClinicalAnalysis } from '@/utils/normalizers/normalizeClinicalResponse.shared';

export interface DetectedRedFlag {
  code: string;
  text: string;
  source: 'deterministic';
  trigger: string;
}

// ─── Text helpers ────────────────────────────────────────────────────────────

const normalizeForMatch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const extractMedicationTexts = (analysis: ClinicalAnalysis): string[] => {
  if (!Array.isArray(analysis.medicacion_actual)) return [];
  return (analysis.medicacion_actual as any[])
    .map((med) => {
      if (typeof med === 'string') return normalizeForMatch(med);
      if (med && typeof med === 'object') {
        const raw =
          med.medication_data?.original_text ||
          med.medication_data?.normalized_name ||
          med.text ||
          '';
        return normalizeForMatch(String(raw));
      }
      return '';
    })
    .filter(Boolean);
};

// ─── Shared keyword lists ─────────────────────────────────────────────────────

const TRAUMA_KEYWORDS = [
  'cai', 'caida', 'caidas', 'golpe', 'tropece', 'accidente',
  'patinete', 'bicicleta', 'escalera', 'tropiezo', 'resbalon',
  'me cai', 'me caido',
];

// ─── Regla 1 — POLIFARMACIA_DEPRESORES_SNC ───────────────────────────────────

const SNC_CLASSES: string[][] = [
  // benzodiacepinas
  ['diazepam', 'alprazolam', 'lorazepam', 'clonazepam', 'bromazepam',
   'trankimazin', 'tranquilmazin', 'valium', 'orfidal'],
  // antidepresivos / ansiolíticos
  ['sertralina', 'fluoxetina', 'paroxetina', 'venlafaxina', 'duloxetina',
   'elipran', 'escitalopram', 'amitriptilina'],
  // opioides
  ['tramadol', 'codeina', 'morfina', 'oxicodona'],
  // antihistamínicos sedantes
  ['loratadina', 'cetirizina'],
];

const detectPolypharmacySNC = (
  transcript: string,
  analysis: ClinicalAnalysis,
): DetectedRedFlag | null => {
  const normalizedTranscript = normalizeForMatch(transcript);
  const medTexts = extractMedicationTexts(analysis);
  const allText = [...medTexts, normalizedTranscript].join(' ');

  const matchedClasses = SNC_CLASSES.filter((cls) =>
    cls.some((drug) => allText.includes(drug)),
  );
  if (matchedClasses.length < 2) return null;

  const triggers = matchedClasses
    .map((cls) => cls.find((drug) => allText.includes(drug)) ?? '')
    .filter(Boolean);

  return {
    code: 'POLIFARMACIA_DEPRESORES_SNC',
    text: 'Riesgo de polifarmacia por uso concomitante de múltiples depresores del SNC. Recomendar revisión médica para optimizar la medicación y reducir el riesgo de caídas.',
    source: 'deterministic',
    trigger: triggers.join(', '),
  };
};

// ─── Regla 2 — TRAUMATISMO_MAYOR_65 ──────────────────────────────────────────

const detectTraumaElderly = (
  transcript: string,
  patientAgeHint?: number,
): DetectedRedFlag | null => {
  const normalized = normalizeForMatch(transcript);
  const traumaTrigger = TRAUMA_KEYWORDS.find((kw) => normalized.includes(kw));
  if (!traumaTrigger) return null;

  let isElderly = patientAgeHint !== undefined && patientAgeHint >= 65;
  if (!isElderly) {
    const ageMatches = normalized.match(/(\d{2,3})\s*a[n]os/g) ?? [];
    isElderly = ageMatches.some((m) => {
      const num = parseInt(m.match(/(\d+)/)?.[1] ?? '0', 10);
      return num >= 65;
    });
  }
  if (!isElderly) return null;

  return {
    code: 'TRAUMATISMO_MAYOR_65',
    text: 'Traumatismo en paciente mayor de 65 años. Recomendar revisión médica para descartar complicaciones estructurales agudas.',
    source: 'deterministic',
    trigger: traumaTrigger,
  };
};

// ─── Regla 3 — DOLOR_NOCTURNO_REPOSO ─────────────────────────────────────────

const NOCTURNAL_PAIN_PATTERNS = [
  'dolor de noche',
  'me duele por la noche',
  'dolor nocturno',
  'no puedo dormir por el dolor',
  'me despierta el dolor',
  'me despierto por el dolor',
  'dolor en reposo',
  'duele de noche',
  'duele por las noches',
];

const detectNocturnalPain = (transcript: string): DetectedRedFlag | null => {
  const normalized = normalizeForMatch(transcript);
  const trigger = NOCTURNAL_PAIN_PATTERNS.find((p) =>
    normalized.includes(normalizeForMatch(p)),
  );
  if (!trigger) return null;

  return {
    code: 'DOLOR_NOCTURNO_REPOSO',
    text: 'Dolor nocturno en reposo referido por el paciente. Descartar patología no mecánica. Recomendar evaluación médica.',
    source: 'deterministic',
    trigger,
  };
};

// ─── Regla 4 — DEFICIT_NEUROLOGICO ───────────────────────────────────────────

const NEURO_PATTERNS = [
  'hormigueo',
  'adormecimiento',
  'entumecimiento',
  'silla de montar',
  'incontinencia',
  'no puedo controlar',
  'perdida de fuerza progresiva',
  'no siento',
  'debilidad en',
  'perdida de sensibilidad',
];

const detectNeurologicalDeficit = (transcript: string): DetectedRedFlag | null => {
  const normalized = normalizeForMatch(transcript);
  const trigger = NEURO_PATTERNS.find((p) =>
    normalized.includes(normalizeForMatch(p)),
  );
  if (!trigger) return null;

  return {
    code: 'DEFICIT_NEUROLOGICO',
    text: 'Posibles signos neurológicos referidos por el paciente. Recomendar evaluación médica urgente para descartar compromiso neurológico.',
    source: 'deterministic',
    trigger,
  };
};

// ─── Regla 5 — ANTICOAGULANTE_TRAUMATISMO ────────────────────────────────────

const ANTICOAGULANTS = [
  'sintrom', 'warfarina', 'heparina', 'rivaroxaban', 'apixaban',
  'acenocumarol', 'dabigatran', 'xarelto', 'eliquis',
];

const detectAnticoagulantTrauma = (
  transcript: string,
  analysis: ClinicalAnalysis,
): DetectedRedFlag | null => {
  const normalized = normalizeForMatch(transcript);
  const medTexts = extractMedicationTexts(analysis);
  const allText = [...medTexts, normalized].join(' ');

  const triggerDrug = ANTICOAGULANTS.find((drug) => allText.includes(drug));
  if (!triggerDrug) return null;

  const triggerTrauma = TRAUMA_KEYWORDS.find((kw) => normalized.includes(kw));
  if (!triggerTrauma) return null;

  return {
    code: 'ANTICOAGULANTE_TRAUMATISMO',
    text: 'Paciente anticoagulado con traumatismo reciente. Recomendar revisión médica para descartar hematoma o complicación hemorrágica.',
    source: 'deterministic',
    trigger: `${triggerDrug} + ${triggerTrauma}`,
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const detectRedFlags = (
  transcript: string,
  analysis: ClinicalAnalysis,
  patientAgeHint?: number,
): DetectedRedFlag[] => {
  const candidates: (DetectedRedFlag | null)[] = [
    detectPolypharmacySNC(transcript, analysis),
    detectTraumaElderly(transcript, patientAgeHint),
    detectNocturnalPain(transcript),
    detectNeurologicalDeficit(transcript),
    detectAnticoagulantTrauma(transcript, analysis),
  ];
  return candidates.filter((f): f is DetectedRedFlag => f !== null);
};

// Merges deterministic flags into existing red_flags string[].
// Deduplicates by checking key terms from each flag's code against existing entries.
export const mergeRedFlags = (
  existing: string[],
  detected: DetectedRedFlag[],
): string[] => {
  if (detected.length === 0) return existing;

  const normalizedExisting = existing.map(normalizeForMatch);

  const toAdd = detected
    .filter((flag) => {
      const keyTerms = flag.code
        .toLowerCase()
        .split('_')
        .filter((w) => w.length > 6);
      return !keyTerms.some((term) =>
        normalizedExisting.some((existing) => existing.includes(term)),
      );
    })
    .map((flag) => flag.text);

  return [...existing, ...toAdd];
};
