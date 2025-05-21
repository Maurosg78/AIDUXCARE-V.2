import React, { useState } from 'react';
import { runSummaryAgent } from '../../../core/agent/ClinicalAgent';
import { saveVisitSummary } from '../../../core/services/visitSummaryService';

interface VisitSummaryGeneratorProps {
  visitId: string;
  userId: string;
}

const VisitSummaryGenerator: React.FC<VisitSummaryGeneratorProps> = ({ visitId, userId }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerateSummary = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(false);

      // Generar resumen usando el agente
      const generatedSummary = await runSummaryAgent(visitId);
      setSummaryText(generatedSummary);

    } catch (err) {
      setError('Error al generar el resumen. Intente nuevamente.');
      console.error('Error al generar resumen:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!summaryText.trim()) {
      setError('El resumen no puede estar vacío');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      // Guardar resumen usando el servicio
      await saveVisitSummary({
        visitId,
        userId,
        summaryText
      });

      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Limpiar el estado después de 3 segundos
      setTimeout(() => {
        setSummaryText('');
        setSuccess(false);
      }, 3000);

    } catch (err) {
      setError('No se pudo guardar el resumen. Intente nuevamente.');
      console.error('Error al guardar resumen:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Resumen Clínico Automático
        </h3>
        <button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generando...' : 'Generar Resumen'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 rounded-md">
          <p className="text-green-600">Resumen guardado exitosamente</p>
        </div>
      )}

      {summaryText && (
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              className="w-full h-48 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="El resumen generado aparecerá aquí..."
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              {summaryText.length} caracteres
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSummary}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Guardando...' : 'Guardar en EMR'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

VisitSummaryGenerator.displayName = 'VisitSummaryGenerator';

export default VisitSummaryGenerator; 