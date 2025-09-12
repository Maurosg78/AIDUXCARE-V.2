import React from 'react';
import { EditableCheckbox } from './EditableCheckbox';
import { AlertTriangle, Activity, Pill, Brain, Heart, Stethoscope } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ClinicalAnalysisResultsProps {
  results: any;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const ClinicalAnalysisResults: React.FC<ClinicalAnalysisResultsProps> = ({
  results,
  selectedIds,
  onSelectionChange,
}) => {
  const { language } = useLanguage();
  
  const texts = {
    en: {
      medicalAlerts: 'Medical-Legal Alerts',
      clinicalFindings: 'Clinical Findings',
      currentSymptoms: 'CURRENT SYMPTOMS',
      currentMedication: 'CURRENT MEDICATION',
      physicalTests: 'Recommended Physical Tests',
      psychosocial: 'Psychosocial Factors and Human Context',
      all: 'All',
      clear: 'Clear',
      addItem: 'Add item'
    },
    es: {
      medicalAlerts: 'Alertas Médico-Legales',
      clinicalFindings: 'Hallazgos Clínicos',
      currentSymptoms: 'SÍNTOMAS ACTUALES',
      currentMedication: 'MEDICACIÓN ACTUAL',
      physicalTests: 'Tests Físicos Recomendados',
      psychosocial: 'Factores Psicosociales',
      all: 'Todo',
      clear: 'Limpiar',
      addItem: 'Agregar'
    }
  };
  
  const t = texts[language];

  const handleSelectAll = (items: any[], prefix: string) => {
    const itemIds = items.map((_, index) => `${prefix}-${index}`);
    const allSelected = itemIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      onSelectionChange(selectedIds.filter(id => !itemIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...itemIds])]);
    }
  };

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(item => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Extract data
  const redFlags = results?.redFlags || [];
  const entities = results?.entities || [];
  const yellowFlags = results?.yellowFlags || [];
  const physicalTests = results?.physicalTests || [];
  
  // Debug logs
  console.log('[UI] Entities received:', entities);
  
  const symptoms = entities.filter((e: any) => e.type === 'symptom');
  const medications = entities.filter((e: any) => e.type === 'medication');
  
  const symptomKeywords = ['pain', 'dizziness', 'fatigue', 'confusion', 'weakness'];
  const symptomsFromYellow = yellowFlags.filter((flag: any) => {
    const flagText = typeof flag === 'string' ? flag : JSON.stringify(flag);
    return symptomKeywords.some(keyword => flagText.toLowerCase().includes(keyword));
  });
  
  const allSymptoms = [
    ...symptoms,
    ...symptomsFromYellow.map((s: any) => ({ type: 'symptom', name: s, source: 'yellowFlags' }))
  ];

  console.log('[UI] Symptoms found:', allSymptoms.length);
  console.log('[UI] Medications found:', medications.length);

  return (
    <div className="space-y-6">
      {/* Medical-Legal Alerts */}
      {redFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">{t.medicalAlerts}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectAll(redFlags, 'red')}
                className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded"
              >
                {t.all}
              </button>
              <button
                onClick={() => onSelectionChange(selectedIds.filter(id => !id.startsWith('red')))}
                className="text-xs px-2 py-1 bg-white hover:bg-gray-100 border rounded"
              >
                {t.clear}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {redFlags.map((flag: any, index: number) => (
              <EditableCheckbox
                key={`red-${index}`}
                id={`red-${index}`}
                text={flag}
                checked={selectedIds.includes(`red-${index}`)}
                onToggle={handleToggle}
                className="text-red-700"
              />
            ))}
            <button className="text-sm text-red-600 hover:text-red-700 mt-2">
              + {t.addItem}
            </button>
          </div>
        </div>
      )}

      {/* Clinical Findings */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">{t.clinicalFindings}</h3>
        </div>
        
        {/* SYMPTOMS */}
        {allSymptoms.length > 0 && (
          <div className="mb-4 p-3 bg-white rounded">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm text-gray-700">{t.currentSymptoms}</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAll(allSymptoms, 'symptom')}
                  className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
                >
                  {t.all}
                </button>
                <button
                  onClick={() => onSelectionChange(selectedIds.filter(id => !id.startsWith('symptom')))}
                  className="text-xs px-2 py-1 bg-white hover:bg-gray-100 border rounded"
                >
                  {t.clear}
                </button>
              </div>
            </div>
            {allSymptoms.map((symptom: any, index: number) => {
              let displayText = '';
              if (symptom.name) {
                displayText = symptom.name;
                if (symptom.location) displayText += ` (${symptom.location})`;
                if (symptom.duration) displayText += ` - ${symptom.duration}`;
              } else {
                displayText = JSON.stringify(symptom);
              }
              
              return (
                <EditableCheckbox
                  key={`symptom-${index}`}
                  id={`symptom-${index}`}
                  text={displayText}
                  checked={selectedIds.includes(`symptom-${index}`)}
                  onToggle={handleToggle}
                />
              );
            })}
            <button className="text-sm text-blue-600 hover:text-blue-700 mt-2">
              + {t.addItem}
            </button>
          </div>
        )}
        
        {/* MEDICATIONS */}
        {medications.length > 0 && (
          <div className="mb-4 p-3 bg-white rounded">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm text-gray-700">{t.currentMedication}</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAll(medications, 'med')}
                  className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded"
                >
                  {t.all}
                </button>
                <button
                  onClick={() => onSelectionChange(selectedIds.filter(id => !id.startsWith('med')))}
                  className="text-xs px-2 py-1 bg-white hover:bg-gray-100 border rounded"
                >
                  {t.clear}
                </button>
              </div>
            </div>
            {medications.map((med: any, index: number) => (
              <EditableCheckbox
                key={`med-${index}`}
                id={`med-${index}`}
                text={`${med.name} ${med.indication ? `(for ${med.indication})` : ''}`}
                checked={selectedIds.includes(`med-${index}`)}
                onToggle={handleToggle}
              />
            ))}
            <button className="text-sm text-blue-600 hover:text-blue-700 mt-2">
              + {t.addItem}
            </button>
          </div>
        )}
      </div>

      {/* Physical Tests */}
      {physicalTests.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">{t.physicalTests}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectAll(physicalTests, 'test')}
                className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 rounded"
              >
                {t.all}
              </button>
              <button
                onClick={() => onSelectionChange(selectedIds.filter(id => !id.startsWith('test')))}
                className="text-xs px-2 py-1 bg-white hover:bg-gray-100 border rounded"
              >
                {t.clear}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {physicalTests.map((test: any, index: number) => {
              let displayText = '';
              if (test.name) {
                const sens = test.sensitivity ? `Sens: ${Math.round(test.sensitivity * 100)}%` : '';
                const spec = test.specificity ? `Spec: ${Math.round(test.specificity * 100)}%` : '';
                const metrics = [sens, spec].filter(Boolean).join(', ');
                displayText = `${test.name}${metrics ? ` (${metrics})` : ''}${test.rationale ? ` - ${test.rationale}` : ''}`;
              } else if (test.finding) {
                displayText = `${test.finding}${test.location ? ` - ${test.location}` : ''}`;
              }
              
              return (
                <EditableCheckbox
                  key={`test-${index}`}
                  id={`test-${index}`}
                  text={displayText}
                  checked={selectedIds.includes(`test-${index}`)}
                  onToggle={handleToggle}
                />
              );
            })}
            <button className="text-sm text-green-600 hover:text-green-700 mt-2">
              + {t.addItem}
            </button>
          </div>
        </div>
      )}

      {/* Psychosocial Factors */}
      {yellowFlags.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">{t.psychosocial}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectAll(yellowFlags, 'yellow')}
                className="text-xs px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded"
              >
                {t.all}
              </button>
              <button
                onClick={() => onSelectionChange(selectedIds.filter(id => !id.startsWith('yellow')))}
                className="text-xs px-2 py-1 bg-white hover:bg-gray-100 border rounded"
              >
                {t.clear}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {yellowFlags.map((flag: any, index: number) => (
              <EditableCheckbox
                key={`yellow-${index}`}
                id={`yellow-${index}`}
                text={flag}
                checked={selectedIds.includes(`yellow-${index}`)}
                onToggle={handleToggle}
              />
            ))}
            <button className="text-sm text-yellow-600 hover:text-yellow-700 mt-2">
              + {t.addItem}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
