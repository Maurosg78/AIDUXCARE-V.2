import { isSpainPilot } from '@/core/pilotDetection';

export const CANONICAL_MODALITIES = [
  'TENS',
  'US',
  'Tecar therapy',
  'Infrared light',
  'Shockwave therapy',
] as const;

type CanonicalModality = (typeof CANONICAL_MODALITIES)[number];

const modalityLabelsEs: Record<CanonicalModality, string> = {
  TENS: 'TENS',
  US: 'Ultrasonido',
  'Tecar therapy': 'Terapia Tecar',
  'Infrared light': 'Luz infrarroja',
  'Shockwave therapy': 'Ondas de choque',
};

export const localizeModalityLabel = (modality: string): string => {
  const canonicalMatch = CANONICAL_MODALITIES.find((candidate) => candidate === modality);

  if (!canonicalMatch) {
    return modality;
  }

  if (!isSpainPilot()) {
    return canonicalMatch;
  }

  const localizedLabel = modalityLabelsEs[canonicalMatch];
  return localizedLabel;
};

export const localizeModalityList = (modalities: string[]): string[] => {
  const localizedModalities = modalities.map((modality) => localizeModalityLabel(modality));
  return localizedModalities;
};
