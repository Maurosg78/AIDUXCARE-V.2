/**
 * Página de Prueba para Gemini Developer API
 * Permite probar la integración con la API gratuita de Gemini
 */

import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/GeminiDeveloperService';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  tokensUsed?: number;
  duration?: number;
}

export default function GeminiTestPage() {
  const [apiKey, setApiKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState('');
  
  const [transcriptionTest, setTranscriptionTest] = useState('');
  const [soapResult, setSoapResult] = useState<TestResult | null>(null);
  const [soapTesting, setSoapTesting] = useState(false);
  
  const [enhancementTest, setEnhancementTest] = useState('');
  const [enhancementResult, setEnhancementResult] = useState<TestResult | null>(null);
  const [enhancementTesting, setEnhancementTesting] = useState(false);
  
  const [usageStats, setUsageStats] = useState<any>(null);

  // Ejemplos de transcripciones para pruebas
  const sampleTranscriptions = {
    hombro: `Paciente refiere dolor en hombro derecho desde hace 3 semanas, especialmente al levantar el brazo. El dolor es de intensidad 7/10, tipo punzante. Se observa limitación en la abducción del hombro, rango de movimiento reducido a 120 grados. Músculo deltoides con ligera atrofia. Test de Neer positivo. Impresión diagnóstica: Síndrome de pinzamiento subacromial. Plan: Fisioterapia 3 veces por semana, antiinflamatorios por 10 días, reevaluación en 2 semanas.`,
    
    lumbalgia: `Dolor lumbar bajo de 2 meses de evolución que se irradia hacia pierna izquierda hasta la rodilla. Dolor tipo eléctrico, intensidad 8/10, empeora al estar sentado. Examen físico muestra contractura de músculos paravertebrales, test de Lasègue positivo a 45 grados. Fuerza muscular conservada. Probable radiculopatía L5-S1. Tratamiento con relajantes musculares, ejercicios de Williams, evitar flexión lumbar prolongada.`,
    
    cervicalgia: `Paciente con cervicalgia postraumática después de accidente vehicular hace 1 semana. Dolor cervical bilateral, rigidez matutina, cefalea occipital. Contractura de músculos suboccipitales y trapecio superior. Rango de movimiento cervical limitado en rotación. Radiografías sin fracturas evidentes. Diagnóstico: Esguince cervical grado II. Plan: Collar cervical blando por 1 semana, termoterapia, ejercicios de movilización suave.`
  };

  const sampleRawTranscriptions = {
    raw1: `paciente dice que le duele mucho el ombro derecho desde ace como tres semanas mas o menos y que cuando lebanta el braso le duele bastante yo veo que tiene el movimiento limitado y cuando ago el test de ner me da positibo creo que es un pinchamiento`,
    
    raw2: `el paciente refiere dolor lumbar que baja asta la pierna izquierda tipo electrico muy fuerte cuando se sienta empeora mucho en el examen fisico se observa contractura y el laseg da positibo a los 45 grados`,
    
    raw3: `despues del accidente de auto la paciente tiene dolor en el cuello mucha rigides en las mañanas y dolor de cabesa en la nuca se palpa contractura de los musculos del cuello`
  };

  useEffect(() => {
    // Verificar si hay API key en variables de entorno
    const envApiKey = process.env.GEMINI_API_KEY;
    if (envApiKey) {
      setApiKey(envApiKey);
    }
    
    // Actualizar estadísticas de uso
    updateUsageStats();
  }, []);

  const updateUsageStats = () => {
    try {
      const stats = geminiService.getUsageStats();
      setUsageStats(stats);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    setConnectionError('');
    
    try {
      const isConnected = await geminiService.testConnection();
      if (isConnected) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setConnectionError('La conexión falló - respuesta inesperada');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Error desconocido');
    }
    
    updateUsageStats();
  };

  const testSOAPClassification = async () => {
    if (!transcriptionTest.trim()) return;
    
    setSoapTesting(true);
    const startTime = Date.now();
    
    try {
      const result = await geminiService.classifySOAP({
        transcription: transcriptionTest,
        context: 'Consulta de fisioterapia'
      });
      
      const duration = Date.now() - startTime;
      
      setSoapResult({
        success: true,
        data: result,
        tokensUsed: result.totalTokensUsed,
        duration
      });
      
    } catch (error) {
      setSoapResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        duration: Date.now() - startTime
      });
    }
    
    setSoapTesting(false);
    updateUsageStats();
  };

  const testTranscriptionEnhancement = async () => {
    if (!enhancementTest.trim()) return;
    
    setEnhancementTesting(true);
    const startTime = Date.now();
    
    try {
      const result = await geminiService.enhanceTranscription(enhancementTest);
      const duration = Date.now() - startTime;
      
      setEnhancementResult({
        success: true,
        data: result,
        duration
      });
      
    } catch (error) {
      setEnhancementResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        duration: Date.now() - startTime
      });
    }
    
    setEnhancementTesting(false);
    updateUsageStats();
  };

  const loadSampleTranscription = (sample: string) => {
    setTranscriptionTest(sample);
    setSoapResult(null);
  };

  const loadSampleRawTranscription = (sample: string) => {
    setEnhancementTest(sample);
    setEnhancementResult(null);
  };

  const setApiKeyInEnv = () => {
    if (apiKey.trim()) {
      // En un entorno real, esto requeriría reiniciar la aplicación
      // Aquí solo mostramos las instrucciones
      alert(`Para configurar la API key permanentemente, ejecuta en terminal:\n\nexport GEMINI_API_KEY="${apiKey}"\n\nLuego reinicia la aplicación.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gemini Developer API - Página de Prueba
          </h1>
          <p className="text-gray-600">
            Prueba la integración con la API gratuita de Gemini para clasificación SOAP y mejora de transcripciones.
          </p>
        </div>

        {/* Configuración API Key */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Configuración API Key
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key de Gemini
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Pega tu API key de Google AI Studio aquí"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={setApiKeyInEnv}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Configurar
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Obtén tu API key gratuita en: <a href="https://aistudio.google.com/apikey" target="_blank" className="text-blue-600 hover:underline">Google AI Studio</a>
              </p>
            </div>

            {/* Test de Conexión */}
            <div className="flex items-center space-x-4">
              <button
                onClick={testConnection}
                disabled={connectionStatus === 'testing'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {connectionStatus === 'testing' ? 'Probando...' : 'Probar Conexión'}
              </button>
              
              {connectionStatus === 'success' && (
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✅</span>
                  Conexión exitosa
                </div>
              )}
              
              {connectionStatus === 'error' && (
                <div className="text-red-600">
                  <span className="mr-2">❌</span>
                  Error: {connectionError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas de Uso */}
        {usageStats && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Estadísticas de Uso (Rate Limits)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900">Requests por Minuto</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {usageStats.requestsThisMinute} / {usageStats.limits.REQUESTS_PER_MINUTE}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900">Tokens por Minuto</h3>
                <p className="text-2xl font-bold text-green-600">
                  {usageStats.tokensThisMinute} / {usageStats.limits.TOKENS_PER_MINUTE}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-medium text-purple-900">Requests Hoy</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {usageStats.requestsToday} / {usageStats.limits.REQUESTS_PER_DAY}
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  Restantes: {usageStats.remainingRequestsToday}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Test de Clasificación SOAP */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test de Clasificación SOAP
          </h2>
          
          <div className="space-y-4">
            {/* Ejemplos rápidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ejemplos de Transcripciones
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadSampleTranscription(sampleTranscriptions.hombro)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Hombro Doloroso
                </button>
                <button
                  onClick={() => loadSampleTranscription(sampleTranscriptions.lumbalgia)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Lumbalgia
                </button>
                <button
                  onClick={() => loadSampleTranscription(sampleTranscriptions.cervicalgia)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cervicalgia
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transcripción a Clasificar
              </label>
              <textarea
                value={transcriptionTest}
                onChange={(e) => setTranscriptionTest(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pega aquí la transcripción médica para clasificar en formato SOAP..."
              />
            </div>

            <button
              onClick={testSOAPClassification}
              disabled={soapTesting || !transcriptionTest.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {soapTesting ? 'Clasificando...' : 'Clasificar SOAP'}
            </button>

            {/* Resultado SOAP */}
            {soapResult && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Resultado de Clasificación SOAP</h3>
                
                {soapResult.success ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Confianza: {soapResult.data.confidence}%</span>
                      <span>Tokens usados: {soapResult.tokensUsed}</span>
                      <span>Tiempo: {soapResult.duration}ms</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(soapResult.data.sections).map(([section, items]) => (
                        <div key={section} className="border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2 uppercase">
                            {section} ({(items as string[]).length})
                          </h4>
                          <ul className="space-y-1">
                            {(items as string[]).map((item, index) => (
                              <li key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Razonamiento</h4>
                      <p className="text-sm text-blue-800">{soapResult.data.reasoning}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-1">Error</h4>
                    <p className="text-sm text-red-800">{soapResult.error}</p>
                    <p className="text-xs text-red-600 mt-1">Tiempo: {soapResult.duration}ms</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Test de Mejora de Transcripción */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Test de Mejora de Transcripción
          </h2>
          
          <div className="space-y-4">
            {/* Ejemplos de transcripciones con errores */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ejemplos de Transcripciones con Errores
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadSampleRawTranscription(sampleRawTranscriptions.raw1)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Hombro (con errores)
                </button>
                <button
                  onClick={() => loadSampleRawTranscription(sampleRawTranscriptions.raw2)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Lumbar (con errores)
                </button>
                <button
                  onClick={() => loadSampleRawTranscription(sampleRawTranscriptions.raw3)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cervical (con errores)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transcripción a Mejorar
              </label>
              <textarea
                value={enhancementTest}
                onChange={(e) => setEnhancementTest(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Pega aquí una transcripción con errores para mejorar..."
              />
            </div>

            <button
              onClick={testTranscriptionEnhancement}
              disabled={enhancementTesting || !enhancementTest.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {enhancementTesting ? 'Mejorando...' : 'Mejorar Transcripción'}
            </button>

            {/* Resultado de Mejora */}
            {enhancementResult && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Resultado de Mejora</h3>
                
                {enhancementResult.success ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 text-right">
                      Tiempo: {enhancementResult.duration}ms
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Original</h4>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-sm text-red-800">{enhancementTest}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Mejorada</h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm text-green-800">{enhancementResult.data}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-1">Error</h4>
                    <p className="text-sm text-red-800">{enhancementResult.error}</p>
                    <p className="text-xs text-red-600 mt-1">Tiempo: {enhancementResult.duration}ms</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
} 