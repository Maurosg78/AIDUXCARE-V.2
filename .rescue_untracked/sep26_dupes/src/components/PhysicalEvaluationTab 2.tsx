import React, { useState } from 'react';
import { Card } from '../shared/ui';
import { ClipboardCheck, CheckCircle, XCircle, AlertCircle, Save } from 'lucide-react';

interface PhysicalEvaluationTabProps {
  selectedTests: string[];
  patientData: any;
  onSaveResults: (results: any) => void;
}

export const PhysicalEvaluationTab: React.FC<PhysicalEvaluationTabProps> = ({
  selectedTests,
  patientData,
  onSaveResults
}) => {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  
  const handleTestResult = (testId: string, result: 'positive' | 'negative' | 'inconclusive') => {
    setTestResults({
      ...testResults,
      [testId]: result
    });
  };
  
  const handleNoteChange = (testId: string, note: string) => {
    setNotes({
      ...notes,
      [testId]: note
    });
  };
  
  const handleSave = () => {
    const results = {
      tests: testResults,
      notes: notes,
      timestamp: new Date().toISOString(),
      evaluator: 'current_user' // Obtener del contexto
    };
    onSaveResults(results);
  };
  
  const getResultIcon = (result: string) => {
    switch(result) {
      case 'positive':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'negative':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'inconclusive':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-4 p-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Evaluación Física</h2>
          <span className="ml-auto text-sm text-gray-500">
            {Object.keys(testResults).length} de {selectedTests.length} completados
          </span>
        </div>
        
        {selectedTests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay tests seleccionados. Vuelve al Tab 1 para seleccionar evaluaciones.
          </div>
        ) : (
          <div className="space-y-4">
            {selectedTests.map((test, index) => (
              <Card key={test} className="p-4 border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{index + 1}. {test}</h3>
                    {testResults[test] && getResultIcon(testResults[test])}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestResult(test, 'positive')}
                      className={`px-3 py-1 rounded ${
                        testResults[test] === 'positive' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 hover:bg-green-100'
                      }`}
                    >
                      Positivo
                    </button>
                    <button
                      onClick={() => handleTestResult(test, 'negative')}
                      className={`px-3 py-1 rounded ${
                        testResults[test] === 'negative' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-200 hover:bg-red-100'
                      }`}
                    >
                      Negativo
                    </button>
                    <button
                      onClick={() => handleTestResult(test, 'inconclusive')}
                      className={`px-3 py-1 rounded ${
                        testResults[test] === 'inconclusive' 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-gray-200 hover:bg-yellow-100'
                      }`}
                    >
                      No concluyente
                    </button>
                  </div>
                  
                  <textarea
                    placeholder="Notas adicionales..."
                    value={notes[test] || ''}
                    onChange={(e) => handleNoteChange(test, e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
      
      {selectedTests.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Progreso: {Math.round((Object.keys(testResults).length / selectedTests.length) * 100)}%
          </div>
          <button
            onClick={handleSave}
            disabled={Object.keys(testResults).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Guardar Resultados
          </button>
        </div>
      )}
    </div>
  );
};
