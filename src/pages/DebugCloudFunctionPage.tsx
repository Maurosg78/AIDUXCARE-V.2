import React, { useState } from 'react';
import { GoogleCloudAudioService, type ClinicalAnalysisRequest, type ClinicalAnalysisResponse } from '../services/GoogleCloudAudioService';

interface ServiceStatus {
  available: boolean;
  message: string;
}

interface TestCase extends ClinicalAnalysisRequest {
  name: string;
}

interface TestResult {
  id: string;
  name: string;
  status: 'running' | 'success' | 'error';
  startTime: string;
  endTime?: string;
  result?: ClinicalAnalysisResponse;
  error?: string;
}

const googleCloudService = new GoogleCloudAudioService();

export const DebugCloudFunctionPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);

  // Casos de prueba específicos para detectar el error textChunker
  const testCases: TestCase[] = [
    {
      name: "Transcripción Mínima",
      transcription: "El paciente refiere dolor en el hombro derecho desde hace una semana.",
      specialty: "physiotherapy" as const,
      sessionType: "initial" as const
    },
    {
      name: "Caso textChunker Original",
      transcription: "Paciente presenta dolor cervical con irradiación hacia el brazo derecho, especialmente al realizar movimientos de flexión lateral. Refiere que el dolor comenzó hace aproximadamente dos semanas tras realizar trabajos de jardinería.",
      specialty: "physiotherapy" as const,
      sessionType: "initial" as const
    },
    {
      name: "Transcripción Compleja",
      transcription: "TERAPEUTA: Buenos días, ¿cómo se encuentra hoy? PACIENTE: Tengo un dolor muy fuerte en el pecho que se irradia hacia el brazo izquierdo. Comenzó esta mañana y no se quita con nada. También siento como si me faltara el aire.",
      specialty: "general_medicine" as const,
      sessionType: "initial" as const
    }
  ];

  const checkServiceStatus = async () => {
    setIsLoading(true);
    try {
      const status = await googleCloudService.getServiceStatus();
      setServiceStatus(status);
    } catch (error) {
      setServiceStatus({
        available: false,
        message: `Error: ${error instanceof Error ? error.message : 'Desconocido'}`
      });
    }
    setIsLoading(false);
  };

  const runSingleTest = async (testCase: TestCase, index: number) => {
    const testId = `test-${index}`;
    setResults(prev => [...prev, {
      id: testId,
      name: testCase.name,
      status: 'running',
      startTime: new Date().toISOString()
    }]);

    try {
      console.log(`🔍 EJECUTANDO TEST: ${testCase.name}`);
      console.log('📋 REQUEST DETAILS:', {
        transcriptionLength: testCase.transcription.length,
        specialty: testCase.specialty,
        sessionType: testCase.sessionType,
        transcriptionPreview: testCase.transcription.substring(0, 100)
      });

      const result = await googleCloudService.analyzeClinicalTranscription(testCase);
      
      setResults(prev => prev.map(r => 
        r.id === testId ? {
          ...r,
          status: result.success ? 'success' : 'error',
          result,
          endTime: new Date().toISOString()
        } : r
      ));

      console.log(`✅ RESULTADO TEST ${testCase.name}:`, result);

    } catch (error) {
      console.error(`❌ ERROR EN TEST ${testCase.name}:`, error);
      
      setResults(prev => prev.map(r => 
        r.id === testId ? {
          ...r,
          status: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido',
          endTime: new Date().toISOString()
        } : r
      ));
    }
  };

  const runAllTests = async () => {
    setResults([]);
    setIsLoading(true);
    
    console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO DE CLOUD FUNCTION');
    
    for (let i = 0; i < testCases.length; i++) {
      await runSingleTest(testCases[i], i);
      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsLoading(false);
    console.log('✅ DIAGNÓSTICO COMPLETO FINALIZADO');
  };

  const clearResults = () => {
    setResults([]);
    setServiceStatus(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔍 Diagnóstico Cloud Function - Error 500 textChunker
          </h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              🎯 MISIÓN: Detectar Causa Raíz Error textChunker.needsChunking
            </h2>
            <p className="text-yellow-700">
              Esta página ejecuta pruebas dirigidas contra la Cloud Function real para capturar 
              el error exacto que está causando el Error 500 y reparar el pipeline.
            </p>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={checkServiceStatus}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              🔍 Verificar Estado del Servicio
            </button>
            
            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              🚀 Ejecutar Diagnóstico Completo
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              🗑️ Limpiar Resultados
            </button>
          </div>

          {serviceStatus && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Estado del Servicio</h3>
              <div className={`p-3 rounded ${serviceStatus.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {serviceStatus.message}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">Ejecutando diagnóstico...</span>
              </div>
            </div>
          )}
        </div>

        {/* Casos de Prueba */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Casos de Prueba</h2>
          <div className="grid gap-4">
            {testCases.map((testCase, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{testCase.name}</h3>
                  <button
                    onClick={() => runSingleTest(testCase, index)}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                  >
                    🔍 Probar
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Especialidad:</strong> {testCase.specialty} | <strong>Tipo:</strong> {testCase.sessionType}
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                  {testCase.transcription.length > 200 ? 
                    testCase.transcription.substring(0, 200) + '...' : 
                    testCase.transcription
                  }
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Resultados de Pruebas */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Resultados del Diagnóstico</h2>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{result.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                      result.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.status === 'running' ? '🔄 Ejecutando' :
                       result.status === 'success' ? '✅ Éxito' : '❌ Error'}
                    </span>
                  </div>
                  
                  {result.startTime && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Inicio:</strong> {new Date(result.startTime).toLocaleTimeString()}
                      {result.endTime && (
                        <span> | <strong>Duración:</strong> {
                          ((new Date(result.endTime).getTime() - new Date(result.startTime).getTime()) / 1000).toFixed(2)
                        }s</span>
                      )}
                    </p>
                  )}

                  {result.result && (
                    <div className="bg-gray-50 rounded p-3">
                      <pre className="text-sm overflow-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="font-semibold text-red-800 mb-1">Error Capturado:</h4>
                      <p className="text-red-700 text-sm">{result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 