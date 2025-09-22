import { useState, useEffect } from 'react';
import { MSK_TESTS_LIBRARY, MSKTest } from '../data/msk-tests-library';

interface SuggestedTest {
  test: string;
  sensibilidad: number;
  especificidad: number;
  objetivo: string;
}

interface TestResult {
  testId: string;
  testName: string;
  value: number | string;
  isNormal: boolean;
  notes?: string;
}

interface PhysicalEvaluationTabProps {
  suggestedTests?: SuggestedTest[]; // TESTS DESDE PESTAÑA 1
  onComplete?: (results: TestResult[]) => void;
}

export function PhysicalEvaluationTab({ suggestedTests = [], onComplete }: PhysicalEvaluationTabProps) {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  // AL CARGAR, PRESELECCIONAR LOS TESTS SUGERIDOS
  useEffect(() => {
    if (suggestedTests.length > 0) {
      // Mapear nombres sugeridos a IDs de la biblioteca
      const suggestedIds = suggestedTests.map(st => {
        const libraryTest = MSK_TESTS_LIBRARY.find(lt => 
          lt.name.toLowerCase().includes(st.test.toLowerCase()) ||
          st.test.toLowerCase().includes(lt.name.toLowerCase())
        );
        return libraryTest?.id;
      }).filter(Boolean) as string[];
      
      setSelectedTests(suggestedIds);
    }
  }, [suggestedTests]);

  const handleTestSelect = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleResultChange = (testId: string, value: string) => {
    const test = MSK_TESTS_LIBRARY.find(t => t.id === testId);
    if (!test) return;

    const numValue = parseFloat(value);
    const isNormal = test.normalRange.min 
      ? numValue >= test.normalRange.min && (!test.normalRange.max || numValue <= test.normalRange.max)
      : test.normalRange.max 
        ? numValue <= test.normalRange.max
        : true;

    setTestResults(prev => ({
      ...prev,
      [testId]: { 
        testId, 
        testName: test.name,
        value: numValue || value, 
        isNormal 
      }
    }));
  };

  // Separar tests sugeridos de tests adicionales
  const suggestedTestIds = suggestedTests.map(st => {
    const lib = MSK_TESTS_LIBRARY.find(lt => 
      lt.name.toLowerCase().includes(st.test.toLowerCase()) ||
      st.test.toLowerCase().includes(lt.name.toLowerCase())
    );
    return lib?.id;
  }).filter(Boolean);

  const suggestedLibraryTests = MSK_TESTS_LIBRARY.filter(t => 
    suggestedTestIds.includes(t.id)
  );
  
  const additionalTests = MSK_TESTS_LIBRARY.filter(t => 
    !suggestedTestIds.includes(t.id)
  );

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold">Physical Evaluation</h2>
      
      {/* TESTS SUGERIDOS (PRIORITARIOS) */}
      {suggestedLibraryTests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-3">
            📋 Suggested Tests from Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedLibraryTests.map(test => (
              <div key={test.id} className="border-2 border-blue-400 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={test.id}
                    checked={selectedTests.includes(test.id)}
                    onChange={() => handleTestSelect(test.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor={test.id} className="font-medium cursor-pointer">
                      {test.name} <span className="text-blue-600">★ Suggested</span>
                    </label>
                    <p className="text-sm text-gray-600">{test.instructions}</p>
                    <p className="text-xs text-gray-500">Normal: {test.normalRange.description}</p>
                    
                    {selectedTests.includes(test.id) && (
                      <div className="mt-2 flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder={`${test.normalRange.min || test.normalRange.max}`}
                          onChange={(e) => handleResultChange(test.id, e.target.value)}
                          className={`w-24 px-2 py-1 border rounded ${
                            testResults[test.id] && !testResults[test.id].isNormal 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-gray-300'
                          }`}
                        />
                        <span className="text-sm">{test.normalRange.unit}</span>
                        {testResults[test.id] && !testResults[test.id].isNormal && (
                          <span className="text-red-600 text-sm">⚠️ Abnormal</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TESTS ADICIONALES DISPONIBLES */}
      <div>
        <h3 className="text-lg font-semibold text-gray-600 mb-3">
          Additional Available Tests
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {additionalTests.map(test => (
            <div key={test.id} className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={test.id}
                  checked={selectedTests.includes(test.id)}
                  onChange={() => handleTestSelect(test.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor={test.id} className="font-medium cursor-pointer">
                    {test.name}
                  </label>
                  <p className="text-sm text-gray-600">{test.instructions}</p>
                  <p className="text-xs text-gray-500">Normal: {test.normalRange.description}</p>
                  
                  {selectedTests.includes(test.id) && (
                    <div className="mt-2 flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder={`${test.normalRange.min || test.normalRange.max}`}
                        onChange={(e) => handleResultChange(test.id, e.target.value)}
                        className={`w-24 px-2 py-1 border rounded ${
                          testResults[test.id] && !testResults[test.id].isNormal 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                      />
                      <span className="text-sm">{test.normalRange.unit}</span>
                      {testResults[test.id] && !testResults[test.id].isNormal && (
                        <span className="text-red-600 text-sm">⚠️ Abnormal</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onComplete?.(Object.values(testResults))}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          disabled={Object.keys(testResults).length === 0}
        >
          Complete Evaluation →
        </button>
      </div>
    </div>
  );
}
