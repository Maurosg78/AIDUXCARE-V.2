import type { AiDuxVoiceCommand, AiDuxVoiceCommandPayload, AiDuxVoiceIntent } from './AiDuxVoiceTypes';

const VOICE_PREFIXES = [/^ai\s?dux/i, /^aïdux/i];

const normalize = (input: string) => input.trim();

const matchesPrefix = (text: string) => VOICE_PREFIXES.some((regex) => regex.test(text));

const extractMedication = (text: string): string | undefined => {
  const medsPatterns = [
    /medicaci[oó]n\s+(?<name>[a-z0-9\- ]+)/i,
    /medicamento\s+(?<name>[a-z0-9\- ]+)/i,
    /drug\s+(?<name>[a-z0-9\- ]+)/i,
    /about\s+(?<name>[a-z0-9\- ]+)/i,
    /effect\s+of\s+(?<name>[a-z0-9\- ]+)/i,
  ];
  for (const pattern of medsPatterns) {
    const match = text.match(pattern);
    if (match?.groups?.name) {
      return match.groups.name.trim();
    }
  }
  return undefined;
};

const extractCondition = (text: string): string | undefined => {
  const conditionPatterns = [
    /para\s+(?<cond>[a-z0-9\- ]+)/i,
    /for\s+(?<cond>[a-z0-9\- ]+)/i,
    /en\s+(?<cond>[a-z0-9\- ]+)/i,
  ];
  for (const pattern of conditionPatterns) {
    const match = text.match(pattern);
    if (match?.groups?.cond) {
      return match.groups.cond.trim();
    }
  }
  return undefined;
};

const extractModality = (text: string): string | undefined => {
  const modalityPatterns = [
    /modalidad\s+(?<name>[a-z0-9\- ]+)/i,
    /modality\s+(?<name>[a-z0-9\- ]+)/i,
    /sobre\s+(?<name>ultrasonido|tecar|laser|electroterapia|magnetoterapia)/i,
    /about\s+(?<name>ultrasound|tecar|laser|electrotherapy|shockwave)/i,
  ];
  for (const pattern of modalityPatterns) {
    const match = text.match(pattern);
    if (match?.groups?.name) {
      return match.groups.name.trim();
    }
  }
  return undefined;
};

const extractBodyRegion = (text: string): string | undefined => {
  const regionPatterns = [
    /tobillo|rodilla|hombro|lumbar|cervical/i,
    /ankle|knee|shoulder|lumbar|cervical|hip/i,
  ];
  for (const pattern of regionPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return undefined;
};

const detectLanguage = (text: string): 'en' | 'es' | 'fr' | undefined => {
  const lower = text.toLowerCase();
  if (/\b(el|la|los|las|para|medicaci[oó]n|resumen|seguro|ejercicio)\b/i.test(lower)) return 'es';
  if (/\b(le|la|les|pour|résumé|médication|sécuritaire)\b/i.test(lower)) return 'fr';
  return undefined;
};

const determineIntent = (commandText: string): AiDuxVoiceIntent => {
  if (/start\s+(live|mode)|modo\s+live/i.test(commandText)) return 'start_live';
  if (/start\s+dictation|modo\s+dictado/i.test(commandText)) return 'start_dictation';
  if (/stop\s+(transcription|recording)|detener\s+transcrip/i.test(commandText)) return 'stop_transcription';
  if (/summarize|resume|resumen/i.test(commandText)) return 'summarize_for_record';
  if (/range\s+of\s+motion|rango\s+de\s+movimiento/i.test(commandText)) return 'ask_range_of_motion_norms';
  if (/red\s+flag|bandera\s+roja|criterios\s+de\s+derivaci[oó]n|flag\s+criteria/i.test(commandText)) return 'ask_flag_criteria';
  if (/exercise|ejercicio/i.test(commandText) && /safe|seguro|safety|prescription|prescripci[oó]n/i.test(commandText)) return 'ask_exercise_prescription_safety';
  if (/modality|modalidad|ultrasound|laser|electro|shockwave|magneto/i.test(commandText)) return 'ask_modality_info';
  if (/tecar/i.test(commandText) && /param/i.test(commandText)) return 'ask_tecar_parameters';
  if (/tecar/i.test(commandText)) return 'ask_tecartherapy_info';
  if (/medication|medicaci[oó]n|medicamento|drug/i.test(commandText) && /effect|efecto/i.test(commandText)) return 'ask_medication_effect';
  if (/medication|medicaci[oó]n|medicamento|drug/i.test(commandText)) return 'ask_medication_info';
  return 'unknown';
};

const buildPayload = (intent: AiDuxVoiceIntent, text: string): AiDuxVoiceCommandPayload | undefined => {
  const payload: AiDuxVoiceCommandPayload = {};
  const language = detectLanguage(text);
  if (language) payload.language = language;

  if (intent === 'ask_medication_info' || intent === 'ask_medication_effect') {
    const medicationName = extractMedication(text);
    if (medicationName) payload.medicationName = medicationName;
  }

  if (
    intent === 'ask_tecartherapy_info' ||
    intent === 'ask_tecar_parameters' ||
    intent === 'ask_exercise_prescription_safety' ||
    intent === 'ask_flag_criteria' ||
    intent === 'ask_range_of_motion_norms'
  ) {
    const region = extractCondition(text) || extractBodyRegion(text);
    if (region) payload.conditionOrRegion = region;
  }

  if (intent === 'ask_modality_info' || intent === 'ask_tecar_parameters') {
    const modality = extractModality(text) || extractCondition(text);
    if (modality) payload.modalityName = modality;
  }

  return Object.keys(payload).length > 0 ? payload : undefined;
};

export class AiDuxVoiceService {
  static mapToCommand(transcript: string): AiDuxVoiceCommand {
    const normalized = normalize(transcript);
    if (!normalized) {
      return { intent: 'unknown', rawText: transcript };
    }

    if (!matchesPrefix(normalized)) {
      return { intent: 'unknown', rawText: transcript };
    }

    const withoutPrefix = normalized
      .replace(/^ai\s?dux\s*/i, '')
      .replace(/^aïdux\s*/i, '')
      .trim();

    const commandText = withoutPrefix.replace(/^[,.:\s]+/, '');
    const intent = determineIntent(commandText);
    const payload = buildPayload(intent, commandText);

    return {
      intent,
      rawText: transcript,
      payload,
    };
  }
}

export default AiDuxVoiceService;
