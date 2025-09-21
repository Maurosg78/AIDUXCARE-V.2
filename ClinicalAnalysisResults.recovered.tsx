import React from 'react';
import { t } from '../utils/translations';
import { AlertCircle, Heart, Activity, AlertTriangle, Pill, Brain } from 'lucide-react';
import { EditableCheckbox } from './EditableCheckbox';
import { useEditableResults } from '../hooks/useEditableResults';

interface EditedResults {
  red_flags?: string[];
  yellow_flags?: string[];
  hallazgos_clinicos?: string[];
  medicacion_actual?: string[];
  evaluaciones_fisicas_sugeridas?: (string | { test: string })[];
  contexto_ocupacional?: string[];
  contexto_psicosocial?: string[];
}

interface ClinicalAnalysisResultsProps {
  results: any;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const ClinicalAnalysisResults: React.FC<ClinicalAnalysisResultsProps> = ({
  results,
  selectedIds,
  onSelectionChange
}) => {
  const { editedResults, handleTextChange } = useEditableResults(results);

  // FIX: actualización inmutable de la selección
  const handleToggle = React.useCallback((id: string) => {
    const idx = selectedIds.indexOf(id);
    if (idx !== -1) {
      const next = [...selectedIds.slice(0, idx), ...selectedIds.slice(idx + 1)];
      onSelectionChange(next);
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }, [selectedIds, onSelectionChange]);

  // Null-safety: si no hay resultados, no renderizamos
  if (!editedResults) {
    return null;
  }

  // Defaults seguros
  const reds = (editedResults as EditedResults).red_flags ?? [];
  const yellows = (editedResults as EditedResults).yellow_flags ?? [];
  const findings = (editedResults as EditedResults).hallazgos_clinicos ?? [];
  const meds = (editedResults as EditedResults).medicacion_actual ?? [];
  const tests = (editedResults as EditedResults).evaluaciones_fisicas_sugeridas ?? [];
  const work = (editedResults as EditedResults).contexto_ocupacional ?? [];
  const psychosocial = (editedResults as EditedResults).contexto_psicosocial ?? [];

  // Categorizar tests
  const categorizeTests = (arr: (string | { test: string })[] = []) => {
    const c = {
      neurologicos: [] as string[],
      articulares: [] as string[],
      musculares: [] as string[],
      posturales: [] as string[],
    };
    for (const item of arr) {
      const testStr = typeof item === 'string' ? item : (item?.test ?? '');
      const s = testStr.toLowerCase();
      if (!s) continue;

      if (/(lasegue|slump|fuerza|sensibilidad|reflejos)/.test(s)) c.neurologicos.push(testStr);
      else if (/(movilidad|rom|patrick|faber|compresion|compresión)/.test(s)) c.articulares.push(testStr);
      else if (/(palpaci[oó]n|gatillo|contractura|tono)/.test(s)) c.musculares.push(testStr);
      else if (/(postural|alineaci[oó]n|postura)/.test(s)) c.posturales.push(testStr);
    }
    return c;
  };

  const testCategories = React.useMemo(() => categorizeTests(tests), [tests]);

  // Helper para marcar ítems que requieren evaluación
  const needsEval = (txt: string) =>
    /\b(no especifica|sin datos)\b/i.test(txt) ||
    (/\bnormal\b/i.test(txt) && txt.length < 40);

  // IDs estables por índice (el texto puede cambiar)
  const idOf = (prefix: string, _text: string, idx: number) => `${prefix}-${idx}`;
  const isChecked = (id: string) => selectedIds.includes(id);

  return (
    <div className="flex flex-col gap-4">

      {/* 1) RED FLAGS */}
      {reds.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3 text-lg">
            <AlertCircle className="w-6 h-6" />
            {t('ALERTAS CRITICAS - DERIVACION URGENTE')}
          </h3>
          <div className="space-y-2">
            {reds.map((flag, i) => {
              const id = idOf('red', flag, i);
              return (
                <EditableCheckbox
                  key={id}
                  id={id}
                  text={flag}
                  checked={isChecked(id)}
                  onToggle={handleToggle}
                  onTextChange={handleTextChange}
                  className="text-red-800 font-semibold"
                  role="checkbox"
                  aria-checked={isChecked(id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 2) HALLAZGOS CLÍNICOS */}
      {(yellows.length > 0 || findings.length > 0 || meds.length > 0) && (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">{t('HALLAZGOS CLINICOS')}</h2>

          {/* 2.1 Yellow */}
          {yellows.length > 0 && (
            <div className="mb-4 pl-4 border-l-4 border-yellow-400">
              <h3 className="font-semibold text-yellow-700 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" />
                {t('Factores Psicosociales de Riesgo')}
              </h3>
              <div className="space-y-1">
                {yellows.map((flag, i) => {
                  const id = idOf('yellow', flag, i);
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={flag}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className="text-yellow-700"
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* 2.2 Hallazgos objetivos */}
          {findings.length > 0 && (
            <div className="mb-4 pl-4 border-l-4 border-blue-400">
              <h3 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5" />
                {t('Hallazgos Objetivos')}
              </h3>
              <div className="space-y-1">
                {findings.map((finding, i) => {
                  const id = idOf('clinical', finding, i);
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={finding}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className="text-gray-700"
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* 2.3 Medicación */}
          {meds.length > 0 && (
            <div className="pl-4 border-l-4 border-orange-400">
              <h3 className="font-semibold text-orange-700 flex items-center gap-2 mb-2">
                <Pill className="w-5 h-5" />
                {t('Medicacion Actual')}
              </h3>
              <div className="space-y-1">
                {meds.map((med, i) => {
                  const id = idOf('med', med, i);
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={med}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className="text-orange-700"
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3) TESTS FÍSICOS */}
      {tests.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-bold text-green-800 flex items-center gap-2 mb-3 text-lg">
            <Activity className="w-5 h-5" />
            {t('TESTS DE EVALUACION FISICA PROPUESTOS')}
          </h3>

          {/* Neuro */}
          {testCategories.neurologicos.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-green-700 mb-2">{t('Tests Neurologicos')}:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                {testCategories.neurologicos.map((test, i) => {
                  const id = idOf('test-neuro', test, i);
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={test}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className="text-gray-700"
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Articulares */}
          {testCategories.articulares.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-green-700 mb-2">{t('Tests Articulares')}:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                {testCategories.articulares.map((test, i) => {
                  const id = idOf('test-art', test, i);
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={test}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className="text-gray-700"
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Musculares */}
          {testCategories.musculares.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-green-700 mb-2">{t('Tests Musculares')}:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                {testCategories.musculares.map((test, i) => {
                  const id = idOf('test-musc', test, i);
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={test}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className="text-gray-700"
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Posturales */}
          {testCategories.posturales.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-700 mb-2">{t('Tests Posturales')}:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                {testCategories.posturales.map((test, i) => {
                  const id = idOf('test-post', test, i);
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={test}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className="text-gray-700"
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4) CONTEXTO BIOPSICOSOCIAL */}
      {(work.length > 0 || psychosocial.length > 0) && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-bold text-purple-800 flex items-center gap-2 mb-3 text-lg">
            <Brain className="w-5 h-5" />
            {t('CONTEXTO BIOPSICOSOCIAL')}
          </h3>

          {/* Ocupacional */}
          {work.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-purple-700 mb-2">{t('Factores Ocupacionales')}:</h4>
              <div className="space-y-1 pl-4">
                {work.map((item, i) => {
                  const id = idOf('ocupacional', item, i);
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={item}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className="text-gray-700"
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Psicosocial */}
          {psychosocial.length > 0 && (
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">{t('Factores Psicosociales')}:</h4>
              <div className="space-y-1 pl-4">
                {psychosocial.map((item, i) => {
                  const id = idOf('psicosocial', item, i);
                  const requiresEval = needsEval(item);
                  const displayText = requiresEval ? `${item} [REQUIERE EVALUACION]` : item;
                  return (
                    <EditableCheckbox
                      key={id}
                      id={id}
                      text={displayText}
                      checked={isChecked(id)}
                      onToggle={handleToggle}
                      onTextChange={handleTextChange}
                      className={requiresEval ? 'text-purple-600 italic' : 'text-gray-700'}
                      role="checkbox"
                      aria-checked={isChecked(id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalAnalysisResults;
