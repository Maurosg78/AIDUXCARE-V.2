// Mapeo determinista texto libre → diagnosisId
// Aliases definidos por CTO clínico — no inferidos por modelo

const DIAGNOSIS_ALIASES: Record<string, string[]> = {
  'fascitis-plantar': [
    'fascitis plantar',
    'fasciitis plantar',
    'fascitis plantar crónica',
    'fascitis plantar derecha',
    'fascitis plantar izquierda',
    'fasciopatía plantar',
    'dolor talón plantar',
    'espolón calcáneo',
    'heel pain plantar',
    'plantar fasciitis',
    'plantar fasciopathy',
  ],
};

const normalizeDiagnosisText = (text: string): string => {
  const lowerCaseText = text.toLowerCase();
  const decomposedText = lowerCaseText.normalize('NFD');
  const withoutDiacritics = decomposedText.replace(/[\u0300-\u036f]/g, '');
  const trimmedText = withoutDiacritics.trim();
  const normalizedWhitespace = trimmedText.replace(/\s+/g, ' ');
  return normalizedWhitespace;
};

// Normalizar: minúsculas, sin tildes, trim
// Retornar key si hay match, null si no
export const matchDiagnosis = (text: string): string | null => {
  const normalizedText = normalizeDiagnosisText(text);

  if (!normalizedText) {
    return null;
  }

  for (const [diagnosisId, aliases] of Object.entries(DIAGNOSIS_ALIASES)) {
    const hasMatch = aliases.some((alias) => {
      const normalizedAlias = normalizeDiagnosisText(alias);
      return normalizedText.includes(normalizedAlias);
    });

    if (hasMatch) {
      return diagnosisId;
    }
  }

  return null;
};
