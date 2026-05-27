import React, { useEffect, useState } from 'react';
import type { WhisperSupportedLanguage } from '../../services/OpenAIWhisperService';
import { DictationButton } from '../ui/DictationButton';
import { isSpainPilot } from '@/core/pilotDetection';

const esPilot = isSpainPilot();

const UI = esPilot
  ? {
      toggle: 'Añadir contexto clínico adicional',
      dictationTitle: 'Dictar contexto clínico adicional',
      label: '¿Algo más que quieras añadir antes de generar la nota?',
      helper: 'Usa este campo para agregar hallazgos, parámetros, contexto o aclaraciones que no quedaron en el audio.',
      placeholder: 'Ej.: rotación cervical estimada 65° bilateral, TENS 15 min bien tolerado, el paciente trajo RM de hombro derecho…',
    }
  : {
      toggle: 'Add extra clinical context',
      dictationTitle: 'Dictate additional clinical context',
      label: 'Anything else to add before generating the note?',
      helper: 'Use this field for findings, treatment parameters, context, or clarifications that were not captured in the audio.',
      placeholder: 'Ex.: cervical rotation estimated 65 degrees bilaterally, TENS 15 min well tolerated, patient brought right shoulder MRI…',
    };

const getDictationSpeechLang = (languagePreference: WhisperSupportedLanguage): string | undefined => {
  switch (languagePreference) {
    case 'es': return 'es-ES';
    case 'fr': return 'fr-CA';
    case 'en': return 'en-CA';
    case 'pt': return 'pt-PT';
    case 'auto':
    default:
      return undefined;
  }
};

interface AdditionalClinicalContextInputProps {
  additionalNotes: string;
  setAdditionalNotes: (value: string) => void;
  languagePreference: WhisperSupportedLanguage;
  isProcessing: boolean;
  isGeneratingSOAP?: boolean;
}

export const AdditionalClinicalContextInput: React.FC<AdditionalClinicalContextInputProps> = ({
  additionalNotes,
  setAdditionalNotes,
  languagePreference,
  isProcessing,
  isGeneratingSOAP,
}) => {
  const [showAdditionalNotes, setShowAdditionalNotes] = useState(Boolean(additionalNotes.trim()));

  useEffect(() => {
    if (additionalNotes.trim()) {
      setShowAdditionalNotes(true);
    }
  }, [additionalNotes]);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-800">{UI.label}</p>
          <p className="mt-1 text-xs text-slate-500">{UI.helper}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdditionalNotes((currentValue) => !currentValue)}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
        >
          {UI.toggle}
        </button>
      </div>

      {showAdditionalNotes ? (
        <div className="mt-3 flex gap-2">
          <textarea
            className="flex-1 min-h-[110px] rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition"
            placeholder={UI.placeholder}
            value={additionalNotes}
            onChange={(event) => setAdditionalNotes(event.target.value)}
          />
          <DictationButton
            value={additionalNotes}
            onChange={setAdditionalNotes}
            disabled={isProcessing || isGeneratingSOAP}
            lang={getDictationSpeechLang(languagePreference)}
            title={UI.dictationTitle}
            className="self-start"
          />
        </div>
      ) : null}
    </div>
  );
};

export default AdditionalClinicalContextInput;
