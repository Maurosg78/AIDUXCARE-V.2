import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../utils/translations';
import { useNiagaraProcessor } from '../hooks/useNiagaraProcessor';
import { updateSessionSafe } from '../utils/updateSessionSafe';
import type { ClinicalAnalysis } from '../utils/cleanVertexResponse';

import WorkflowAnalysisTab from '../components/professional/WorkflowAnalysisTab';
import SOAPReportTab from '../components/professional/SOAPReportTab';

export default function ProfessionalWorkflowPage() {
  const t = useTranslation();
  const { processText } = useNiagaraProcessor();

  const [transcript, setTranscript] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ClinicalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Efecto demo-safe: no romper si el servicio no existe
  useEffect(() => {
    void updateSessionSafe({ at: Date.now(), page: 'ProfessionalWorkflow' });
  }, []);

  const handleAnalyzeWithAI = useCallback(async () => {
    if (!transcript || !transcript.trim()) return;
    try {
      setIsLoading(true);
      const cleaned = await processText(transcript);
      setAnalysisResult(cleaned);
    } catch (e) {
      console.error('[Analyze] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [transcript, processText]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-3">
        <label className="block text-sm font-semibold mb-1">
          {t('Transcripción')}
        </label>
        <textarea
          className="w-full border rounded p-2 min-h-[140px]"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={t('Pega la entrevista clínica aquí…')}
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleAnalyzeWithAI}
            disabled={isLoading || !transcript.trim()}
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {isLoading ? t('Analizando…') : t('Analizar con IA')}
          </button>
        </div>
      </div>

      {/* Tabs simples (Análisis / SOAP). Si tienes router o tabs reales, reemplaza por tu contenedor */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h2 className="font-bold mb-2">{t('Análisis')}</h2>
          <WorkflowAnalysisTab
            analysisResult={analysisResult}
            isLoading={isLoading}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
          />
        </div>

        <div className="border rounded p-3">
          <h2 className="font-bold mb-2">{t('Informe SOAP')}</h2>
          <SOAPReportTab
            analysisResult={analysisResult}
            selectedIds={selectedIds}
          />
        </div>
      </div>
    </div>
  );
}
