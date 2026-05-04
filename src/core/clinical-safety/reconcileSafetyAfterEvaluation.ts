import type { ReconciliationInput, SafetyReconciliationDelta } from './types';

const ALARM_PHYSICAL_FINDING_TERMS = [
  'esfínter',
  'perineal',
  'cauda',
  'latigazo',
  'irradiación bilateral',
  'pérdida de fuerza bilateral',
  'anestesia en silla de montar',
] as const;

const KNOWN_RISK_MEDICATION_TERMS = [
  'anticoagulante',
  'warfarina',
  'acenocumarol',
  'heparina',
  'rivaroxaban',
  'apixaban',
  'dabigatran',
  'clopidogrel',
  'corticoide',
  'prednisona',
  'dexametasona',
  'opioide',
  'morfina',
  'oxicodona',
  'tramadol',
  'benzodiacepina',
  'diazepam',
  'lorazepam',
  'alprazolam',
  'inmunosupresor',
  'metotrexato',
  'biológico',
  'bifosfonato',
  'alendronato',
  'quinolona',
  'ciprofloxacino',
  'levofloxacino',
] as const;

export function reconcileSafetyAfterEvaluation(
  input: ReconciliationInput,
): SafetyReconciliationDelta {
  const initialFlags = unique([
    ...input.initial_red_flags,
    ...input.initial_yellow_flags,
  ]);
  const correctedMedications = unique(input.corrected_medications);
  const resolvedFlags = resolveMedicationFlags(initialFlags, correctedMedications);
  const newYellowFlags = identifyMedicationRiskFlags(correctedMedications);
  const newRedFlags = identifyPhysicalAlarmFlags(input.physical_evaluation_findings);
  const unchangedFlags = initialFlags.filter((flag) => !resolvedFlags.includes(flag));

  return {
    new_red_flags: newRedFlags,
    new_yellow_flags: newYellowFlags,
    resolved_flags: resolvedFlags,
    unchanged_flags: unchangedFlags,
    rationale: buildRationale({
      resolvedFlags,
      newYellowFlags,
      newRedFlags,
      unchangedFlags,
    }),
  };
}

function resolveMedicationFlags(
  initialFlags: readonly string[],
  correctedMedications: readonly string[],
): string[] {
  if (correctedMedications.length === 0) {
    return [];
  }

  return initialFlags.filter((flag) => {
    const normalizedFlag = normalizeClinicalText(flag);

    return correctedMedications.some((medication) =>
      normalizedFlag.includes(normalizeClinicalText(medication)),
    );
  });
}

function identifyMedicationRiskFlags(
  correctedMedications: readonly string[],
): string[] {
  return unique(
    correctedMedications
      .filter((medication) =>
        KNOWN_RISK_MEDICATION_TERMS.some((riskTerm) =>
          normalizeClinicalText(medication).includes(normalizeClinicalText(riskTerm)),
        ),
      )
      .map(
        (medication) =>
          `Medicamento confirmado con perfil de riesgo conocido: ${medication}`,
      ),
  );
}

function identifyPhysicalAlarmFlags(
  physicalEvaluationFindings: readonly string[],
): string[] {
  return unique(
    physicalEvaluationFindings
      .filter((finding) =>
        ALARM_PHYSICAL_FINDING_TERMS.some((alarmTerm) =>
          normalizeClinicalText(finding).includes(normalizeClinicalText(alarmTerm)),
        ),
      )
      .map((finding) => `Hallazgo físico de alarma: ${finding}`),
  );
}

function buildRationale(delta: {
  readonly resolvedFlags: readonly string[];
  readonly newYellowFlags: readonly string[];
  readonly newRedFlags: readonly string[];
  readonly unchangedFlags: readonly string[];
}): string[] {
  const rationale: string[] = [];

  for (const flag of delta.resolvedFlags) {
    rationale.push(
      `Flag inicial reconciliado como resuelto por corrección de medicación: ${flag}`,
    );
  }

  for (const flag of delta.newYellowFlags) {
    rationale.push(
      `Nuevo yellow flag por medicamento confirmado con perfil de riesgo conocido: ${flag}`,
    );
  }

  for (const flag of delta.newRedFlags) {
    rationale.push(
      `Nuevo red flag por hallazgo físico post-evaluación con término de alarma: ${flag}`,
    );
  }

  if (delta.unchangedFlags.length > 0) {
    rationale.push(
      'Los flags iniciales restantes se mantienen sin cambios hasta confirmación explícita del fisioterapeuta.',
    );
  }

  rationale.push(
    'La reconciliación propone el delta de seguridad; el fisioterapeuta confirma qué entra al SOAP.',
  );

  return rationale;
}

function normalizeClinicalText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es-ES');
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
