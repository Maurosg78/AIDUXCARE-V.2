import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircleQuestion, ShieldCheck, X } from 'lucide-react';

import {
  validateSocraticReasoningResponse,
  type SocraticReasoningResponse,
  type SocraticSyntheticSource,
} from '@/core/ai/buildSocraticReasoningPrompt';
import { hasSocraticLongitudinalConsent } from '@/core/socratic/socraticConsentGate';
import { useProfessionalProfile } from '@/context/ProfessionalProfileContext';

const SYNTHETIC_SOURCES: SocraticSyntheticSource[] = [
  {
    id: 'DEMO-SESSION-1',
    kind: 'synthetic_patient_fact',
    citation: 'Caso sintético · Sesión 1',
    content: 'La persona simulada tolera caminar durante 20 minutos.',
  },
  {
    id: 'DEMO-SESSION-2',
    kind: 'synthetic_patient_fact',
    citation: 'Caso sintético · Sesión 2',
    content: 'La tolerancia simulada aumenta a 30 minutos y persisten molestias matutinas.',
  },
  {
    id: 'DEMO-EVIDENCE-1',
    kind: 'synthetic_evidence',
    citation: 'Referencia sintética DEMO-E1 · Sin validez clínica',
    content: 'Fixture bibliográfico creado únicamente para probar atribución de fuentes.',
  },
];

const SYNTHETIC_RESPONSE: SocraticReasoningResponse = {
  questions: [
    {
      id: 'Q1',
      question: '¿Qué cambio funcional entre la sesión 1 y la sesión 2 merece aclararse antes de interpretar la evolución?',
      sourceRefs: ['DEMO-SESSION-1', 'DEMO-SESSION-2'],
    },
    {
      id: 'Q2',
      question: '¿Qué información adicional ayudaría a comprender si la mayor tolerancia se mantiene fuera de la consulta?',
      sourceRefs: ['DEMO-SESSION-2'],
    },
    {
      id: 'Q3',
      question: '¿Cómo relacionarías la persistencia de molestias matutinas con la medida funcional documentada?',
      sourceRefs: ['DEMO-SESSION-2', 'DEMO-EVIDENCE-1'],
    },
  ],
};

const SOURCE_BY_ID = new Map(
  SYNTHETIC_SOURCES.map((source) => {
    return [source.id, source] as const;
  })
);

export const SocraticSyntheticDemoPanel: React.FC = () => {
  const { profile } = useProfessionalProfile();
  const [isOpen, setIsOpen] = useState(false);
  const consentGranted = hasSocraticLongitudinalConsent(profile?.dataUseConsent);
  const allowedSourceIds = useMemo(() => {
    return SYNTHETIC_SOURCES.map((source) => source.id);
  }, []);
  const validationResult = useMemo(() => {
    return validateSocraticReasoningResponse(SYNTHETIC_RESPONSE, allowedSourceIds);
  }, [allowedSourceIds]);

  useEffect(() => {
    if (validationResult.ok === false) {
      console.warn('[SOCRATES-ANOMALY] Synthetic demo fixture rejected', {
        errorCount: validationResult.errors.length,
        errors: validationResult.errors,
      });
    }
  }, [validationResult]);

  if (!import.meta.env.DEV) {
    return null;
  }

  if (validationResult.ok === false) {
    return null;
  }

  if (!isOpen) {
    return (
      <section className="mt-6 border-y border-emerald-300 bg-emerald-50 px-4 py-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-400 bg-white text-emerald-800">
              <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-emerald-950">
                  Sócrates
                </h2>
                <span className="border border-amber-400 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                  Demo sintética
                </span>
              </div>
              <p className="mt-1 text-sm text-emerald-900">
                Preguntas para profundizar tu razonamiento clínico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            disabled={!consentGranted}
            title={consentGranted ? 'Abrir demo sintética de Sócrates' : 'Requiere los dos consentimientos longitudinales'}
            className="inline-flex min-h-10 items-center justify-center gap-2 border border-emerald-800 bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
          >
            <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
            {consentGranted ? 'Abrir demo' : 'Consentimiento requerido'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 border-y-2 border-emerald-500 bg-white" aria-labelledby="socratic-demo-heading">
      <header className="bg-emerald-950 px-4 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="socratic-demo-heading" className="text-base font-semibold">
                  Preguntas para profundizar tu razonamiento clínico
                </h2>
                <span className="border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-950">
                  Datos sintéticos
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-100">
                Prototipo Mode 1 · Sin conexión a historias clínicas ni Vertex
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            title="Cerrar"
            aria-label="Cerrar demo de Sócrates"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-600 text-emerald-100 transition hover:bg-emerald-900 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-2">
        {validationResult.value.questions.map((question, questionIndex) => {
          const citedSources = question.sourceRefs
            .map((sourceRef) => SOURCE_BY_ID.get(sourceRef))
            .filter((source): source is SocraticSyntheticSource => source !== undefined);

          return (
            <article
              key={question.id}
              className="grid gap-3 border-b border-slate-200 py-5 last:border-b-0 sm:grid-cols-[2rem_minmax(0,1fr)]"
            >
              <div className="flex h-8 w-8 items-center justify-center border border-emerald-300 bg-emerald-50 text-sm font-bold text-emerald-900">
                {questionIndex + 1}
              </div>
              <div className="min-w-0">
                <p className="text-base font-medium leading-6 text-slate-950">
                  {question.question}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {citedSources.map((source) => {
                    return (
                      <span
                        key={source.id}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-600"
                      >
                        <span className="font-semibold text-emerald-800">Fuente:</span>
                        {source.citation}
                      </span>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
