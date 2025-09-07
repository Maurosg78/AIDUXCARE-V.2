import React, { useMemo } from 'react';
import { AlertCircle, Heart, Brain, Activity, AlertTriangle } from 'lucide-react';
import { EditableCheckbox } from './EditableCheckbox';
import { AddCustomItemButton } from './AddCustomItemButton';
import { useEditableResults } from '../hooks/useEditableResults';

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
  const { editedResults, handleTextChange, addCustomItem } = useEditableResults(results);
  
  const physicalTests = useMemo(() => 
    editedResults?.physicalTests || [], 
    [editedResults?.physicalTests]
  );

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(item => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = (section: string) => {
    let idsToSelect: string[] = [];
    
    switch(section) {
      case 'alerts':
        const alertIds: string[] = [];
        editedResults?.redFlags?.forEach((_, i) => alertIds.push(`red-${i}`));
        editedResults?.entities?.filter(e => e.type === 'medication')
          .forEach(e => e.id && alertIds.push(e.id));
        idsToSelect = alertIds;
        break;
        
      case 'clinical':
        idsToSelect = editedResults?.entities?.map(e => e.id).filter(Boolean) || [];
        break;
        
      case 'physical':
        idsToSelect = physicalTests.map((_, i) => `physical-${i}`);
        break;
        
      case 'psychosocial':
        idsToSelect = editedResults?.yellowFlags?.map((_, i) => `yellow-${i}`) || [];
        break;
    }
    
    const newSelection = [...new Set([...selectedIds, ...idsToSelect])];
    onSelectionChange(newSelection);
  };

  const handleSelectNone = (section: string) => {
    let idsToRemove: string[] = [];
    
    switch(section) {
      case 'alerts':
        idsToRemove = selectedIds.filter(id => 
          id.startsWith('red-') || 
          editedResults?.entities?.find(e => e.id === id && e.type === 'medication')
        );
        break;
        
      case 'clinical':
        idsToRemove = selectedIds.filter(id => 
          editedResults?.entities?.find(e => e.id === id)
        );
        break;
        
      case 'physical':
        idsToRemove = selectedIds.filter(id => id.startsWith('physical-'));
        break;
        
      case 'psychosocial':
        idsToRemove = selectedIds.filter(id => id.startsWith('yellow-'));
        break;
    }
    
    onSelectionChange(selectedIds.filter(id => !idsToRemove.includes(id)));
  };

  if (!editedResults) return null;

  const criticalMeds = editedResults.entities?.filter(e => 
    e.type === 'medication' && e.text?.toLowerCase().includes('sin prescri')
  ) || [];

  return (
    <div className="flex flex-col gap-4">
      
      {/* FILA 1: Alertas Médico-Legales */}
      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-gray-800">Alertas Médico-Legales</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleSelectAll('alerts')}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Todo
            </button>
            <button 
              onClick={() => handleSelectNone('alerts')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {criticalMeds.map((med) => (
            <EditableCheckbox
              key={med.id}
              id={med.id}
              text={`⚠️ ${med.text}`}
              checked={selectedIds.includes(med.id)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
              className="p-2 bg-white border-l-4 border-red-500 rounded"
            />
          ))}
          
          {editedResults.redFlags?.map((flag, i) => (
            <EditableCheckbox
              key={`red-${i}`}
              id={`red-${i}`}
              text={flag}
              checked={selectedIds.includes(`red-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
              className="p-2 bg-white rounded"
            />
          ))}
        </div>
        
        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => addCustomItem('redFlags', text)}
            placeholder="Agregar alerta médico-legal..."
          />
        </div>
      </div>

      {/* FILA 2: Hallazgos Clínicos */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Hallazgos Clínicos</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleSelectAll('clinical')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Todo
            </button>
            <button 
              onClick={() => handleSelectNone('clinical')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">SÍNTOMAS ACTUALES</h4>
            <div className="space-y-1">
              {editedResults.entities?.filter(e => e.type === 'symptom').map((entity) => (
                <EditableCheckbox
                  key={entity.id}
                  id={entity.id}
                  text={entity.text}
                  checked={selectedIds.includes(entity.id)}
                  onToggle={handleToggle}
                  onTextChange={handleTextChange}
                />
              ))}
            </div>
            <div className="mt-2">
              <AddCustomItemButton
                onAdd={(text) => addCustomItem('symptoms', text)}
                placeholder="Agregar síntoma..."
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">MEDICACIÓN ACTUAL</h4>
            <div className="space-y-1">
              {editedResults.entities?.filter(e => e.type === 'medication' && !e.text?.toLowerCase().includes('sin prescri'))
                .map((entity) => (
                  <EditableCheckbox
                    key={entity.id}
                    id={entity.id}
                    text={entity.text}
                    checked={selectedIds.includes(entity.id)}
                    onToggle={handleToggle}
                    onTextChange={handleTextChange}
                  />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FILA 3: Evaluación Física */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Evaluación Física Propuesta</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleSelectAll('physical')}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              Todo
            </button>
            <button 
              onClick={() => handleSelectNone('physical')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {physicalTests.map((test, i) => (
            <EditableCheckbox
              key={`physical-${i}`}
              id={`physical-${i}`}
              text={`${i + 1}. ${typeof test === 'string' ? test : (test.name || test.test || 'Test físico')}`}
              checked={selectedIds.includes(`physical-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
            />
          ))}
        </div>
        
        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => addCustomItem('physical', text)}
            placeholder="Agregar test físico personalizado..."
          />
        </div>
      </div>

      {/* FILA 4: Factores Psicosociales */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-800">Factores Psicosociales y Contexto Humano</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleSelectAll('psychosocial')}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Todo
            </button>
            <button 
              onClick={() => handleSelectNone('psychosocial')}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {editedResults.yellowFlags?.map((flag, i) => (
            <EditableCheckbox
              key={`yellow-${i}`}
              id={`yellow-${i}`}
              text={flag}
              checked={selectedIds.includes(`yellow-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
            />
          ))}
        </div>
        
        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => addCustomItem('yellowFlags', text)}
            placeholder="Agregar factor psicosocial..."
          />
        </div>
      </div>
    </div>
  );
};


export default ClinicalAnalysisResults;
