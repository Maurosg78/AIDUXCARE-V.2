import React, { useState, useEffect } from 'react';
import { useSharedWorkflowState } from '../hooks/useSharedWorkflowState';
import { CheckCircle, XCircle, AlertCircle, Plus, Minus } from 'lucide-react';

interface PhysicalTest {
  name: string;
  description: string;
  normalRange?: string;
  category: 'orthopedic' | 'neurologic' | 'functional' | 'special';
}

interface PhysicalEvaluationTabProps {
  onComplete?: () => void;
}

export const PhysicalEvaluationTab: React.FC<PhysicalEvaluationTabProps> = ({ onComplete }) => {
  const {
    suggestedTests,
    physicalExamResults,
    updatePhysicalExamResults,
    trackSkippedTest,
    analysisResults
  } = useSharedWorkflowState();

  const [currentResults, setCurrentResults] = useState<any[]>(physicalExamResults);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  const handleTestResult = (testName: string, result: any) => {
    const updatedResults = currentResults.filter(r => r.testName !== testName);
    
    if (result !== null) {
      updatedResults.push({
        testName,
        result,
        timestamp: new Date().toISOString(),
        notes: ''
      });
    } else {
      trackSkippedTest(testName);
    }

    setCurrentResults(updatedResults);
    updatePhysicalExamResults(updatedResults);
  };

  const handleNotes = (testName: string, notes: string) => {
    const updatedResults = currentResults.map(r => 
      r.testName === testName ? { ...r, notes } : r
    );
    setCurrentResults(updatedResults);
    updatePhysicalExamResults(updatedResults);
  };

  if (!analysisResults) {
    return (
      <div className="p-8 text-center text-gray-500">
        Primero complete el análisis clínico
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Tests Recomendados
        </h3>
        <div className="text-sm text-blue-800">
          <p>Total: {suggestedTests.length} tests</p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestedTests.map((testName) => {
          const result = currentResults.find(r => r.testName === testName);
          const isExpanded = expandedTests.has(testName);
          
          return (
            <div key={testName} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedTests);
                        if (isExpanded) {
                          newExpanded.delete(testName);
                        } else {
                          newExpanded.add(testName);
                        }
                        setExpandedTests(newExpanded);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
                    </button>
                    <span className="font-medium">{testName}</span>
                    {result && (
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        result.result === 'positive' 
                          ? 'bg-red-100 text-red-700'
                          : result.result === 'negative'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {result.result === 'positive' ? 'Positivo' :
                         result.result === 'negative' ? 'Negativo' : 
                         'Inconcluso'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleTestResult(testName, 'positive')}
                    className={`p-2 rounded ${
                      result?.result === 'positive'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 hover:bg-red-100'
                    }`}
                    title="Positivo"
                  >
                    <CheckCircle size={20} />
                  </button>
                  
                  <button
                    onClick={() => handleTestResult(testName, 'negative')}
                    className={`p-2 rounded ${
                      result?.result === 'negative'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 hover:bg-green-100'
                    }`}
                    title="Negativo"
                  >
                    <XCircle size={20} />
                  </button>
                  
                  <button
                    onClick={() => handleTestResult(testName, 'inconclusive')}
                    className={`p-2 rounded ${
                      result?.result === 'inconclusive'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 hover:bg-yellow-100'
                    }`}
                    title="Inconcluso"
                  >
                    <AlertCircle size={20} />
                  </button>
                </div>
              </div>
              
              {result && isExpanded && (
                <div className="mt-3">
                  <textarea
                    value={result.notes || ''}
                    onChange={(e) => handleNotes(testName, e.target.value)}
                    placeholder="Notas adicionales..."
                    className="w-full p-2 border rounded text-sm"
                    rows={2}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Resumen</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Realizados:</span>
            <span className="ml-2 font-medium">{currentResults.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Positivos:</span>
            <span className="ml-2 font-medium text-red-600">
              {currentResults.filter(r => r.result === 'positive').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Negativos:</span>
            <span className="ml-2 font-medium text-green-600">
              {currentResults.filter(r => r.result === 'negative').length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          onClick={onComplete}
        >
          Continuar a SOAP →
        </button>
      </div>
    </div>
  );
};
