// Gate técnico para Sócrates Modo 1.5 y Modo 2.
// Estos modos no se activan sin los prerequisitos regulatorios documentados.
// Ver docs/governance/SAMD_CLASSIFICATION_MEMO.md
// Ver docs/governance/AI_RISK_MANAGEMENT_FILE.md
// Ver docs/governance/DPIA_SOCRATES.md
// Ver docs/governance/EVIDENCE_REVIEW_PROTOCOL.md

export type SocratesMode = 'mode_0' | 'mode_1_5' | 'mode_2';

type GateKey =
  | 'SAMD_CLASSIFICATION_MEMO_V1_0'
  | 'AI_RISK_MANAGEMENT_FILE_V1_0'
  | 'DPIA_V1_0'
  | 'EVIDENCE_REVIEW_PROTOCOL_V1_0'
  | 'EXTERNAL_LEGAL_REVIEW';

const SOCRATES_MODE_GATES: Record<SocratesMode, GateKey[]> = {
  mode_0: [],
  mode_1_5: [
    'SAMD_CLASSIFICATION_MEMO_V1_0',
    'AI_RISK_MANAGEMENT_FILE_V1_0',
    'DPIA_V1_0',
    'EVIDENCE_REVIEW_PROTOCOL_V1_0',
  ],
  mode_2: [
    'SAMD_CLASSIFICATION_MEMO_V1_0',
    'AI_RISK_MANAGEMENT_FILE_V1_0',
    'DPIA_V1_0',
    'EVIDENCE_REVIEW_PROTOCOL_V1_0',
    'EXTERNAL_LEGAL_REVIEW',
  ],
};

function resolveGateEnvKey(gate: GateKey): string {
  return `VITE_SOCRATES_GATE_${gate}`;
}

export function isSocratesModeEnabled(mode: SocratesMode): boolean {
  if (mode === 'mode_0') return true;

  const requiredGates = SOCRATES_MODE_GATES[mode];
  return requiredGates.every((gate) => {
    const envKey = resolveGateEnvKey(gate);
    return import.meta.env[envKey] === 'true';
  });
}

export function getSocratesModeGates(mode: SocratesMode): GateKey[] {
  return SOCRATES_MODE_GATES[mode];
}

export function getMissingGates(mode: SocratesMode): GateKey[] {
  if (mode === 'mode_0') return [];

  return SOCRATES_MODE_GATES[mode].filter((gate) => {
    const envKey = resolveGateEnvKey(gate);
    return import.meta.env[envKey] !== 'true';
  });
}
