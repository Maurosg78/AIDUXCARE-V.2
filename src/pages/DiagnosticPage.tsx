import React, { useState, useEffect } from 'react';

export const DiagnosticPage: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    browserSupport: boolean;
    permissions: boolean;
    networkTest: boolean;
    actualTest: string | null;
    errorDetails: string | null;
  }>({
    browserSupport: false,
    permissions: false,
    networkTest: false,
    actualTest: null,
    errorDetails: null
  });

  const [isRunningTest, setIsRunningTest] = useState(false);

  useEffect(() => {
    runBasicChecks();
  }, []);

  const runBasicChecks = async () => {
    // 1. Verificar soporte del navegador
    const browserSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    
    // 2. Verificar permisos
    let permissions = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissions = true;
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Permission check failed:', error);
    }

    // 3. Verificar red
    const networkTest = navigator.onLine;

    setTestResults(prev => ({
      ...prev,
      browserSupport,
      permissions,
      networkTest
    }));
  };

  const runSpeechTest = async () => {
    setIsRunningTest(true);
    setTestResults(prev => ({ ...prev, actualTest: null, errorDetails: null }));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setTestResults(prev => ({ 
        ...prev, 
        actualTest: 'FALLÓ: Navegador no soporta Web Speech API',
        errorDetails: 'Este navegador no tiene SpeechRecognition disponible'
      }));
      setIsRunningTest(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      let hasStarted = false;
      let hasResult = false;

      recognition.onstart = () => {
        hasStarted = true;
        setTestResults(prev => ({ 
          ...prev, 
          actualTest: 'SUCCESS: Iniciado correctamente - Habla ahora para probar...'
        }));
      };

      recognition.onresult = (event: any) => {
        hasResult = true;
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTestResults(prev => ({ 
          ...prev, 
          actualTest: `SUCCESS: TRANSCRIPCIÓN EXITOSA: "${transcript}"`
        }));
        recognition.stop();
        setIsRunningTest(false);
      };

      recognition.onerror = (event: any) => {
        const errorInfo = {
          error: event.error,
          message: event.message || 'Sin mensaje específico'
        };

        let detailedError = `Error tipo: ${event.error}\n`;
        
        switch (event.error) {
          case 'network':
            detailedError += 'DIAGNÓSTICO: Problema de conexión.\n';
            detailedError += '- Verifica tu conexión a internet\n';
            detailedError += '- El servicio de Google puede estar bloqueado\n';
            detailedError += '- Firewall corporativo puede estar interfiriendo';
            break;
          case 'not-allowed':
            detailedError += 'DIAGNÓSTICO: Permisos denegados.\n';
            detailedError += '- Ve a configuración del navegador\n';
            detailedError += '- Permite acceso al micrófono para este sitio';
            break;
          case 'audio-capture':
            detailedError += 'DIAGNÓSTICO: Error capturando audio.\n';
            detailedError += '- Verifica que el micrófono esté conectado\n';
            detailedError += '- Otro programa puede estar usando el micrófono';
            break;
          case 'service-not-allowed':
            detailedError += 'DIAGNÓSTICO: Servicio no permitido.\n';
            detailedError += '- El navegador bloquea el servicio\n';
            detailedError += '- Puede ser un problema de configuración corporativa';
            break;
          default:
            detailedError += `DIAGNÓSTICO: Error desconocido (${event.error})`;
        }

        setTestResults(prev => ({ 
          ...prev, 
          actualTest: `ERROR: ERROR: ${event.error}`,
          errorDetails: detailedError
        }));
        setIsRunningTest(false);
      };

      recognition.onend = () => {
        if (!hasResult && hasStarted) {
          setTestResults(prev => ({ 
            ...prev, 
            actualTest: 'WARNING: Sesión terminó sin capturar audio - Intenta hablar más fuerte'
          }));
        }
        setIsRunningTest(false);
      };

      recognition.start();

      // Timeout de seguridad
      setTimeout(() => {
        if (isRunningTest && !hasResult) {
          recognition.stop();
          setTestResults(prev => ({ 
            ...prev, 
            actualTest: 'TIME: Timeout - No se detectó habla en 10 segundos'
          }));
          setIsRunningTest(false);
        }
      }, 10000);

    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        actualTest: `💥 Error fatal: ${error}`,
        errorDetails: error instanceof Error ? error.stack || error.message : String(error)
      }));
      setIsRunningTest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Diagnóstico Web Speech API</h1>
          <p className="text-gray-600 mb-8">
            Esta página diagnostica problemas con la transcripción en tiempo real
          </p>

          {/* Verificaciones básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`p-4 rounded-lg border ${testResults.browserSupport ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{testResults.browserSupport ? 'SUCCESS:' : 'ERROR:'}</span>
                <div>
                  <h3 className="font-medium text-gray-900">Navegador</h3>
                  <p className="text-sm text-gray-600">
                    {testResults.browserSupport ? 'Compatible' : 'No compatible'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${testResults.permissions ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{testResults.permissions ? 'SUCCESS:' : 'ERROR:'}</span>
                <div>
                  <h3 className="font-medium text-gray-900">Micrófono</h3>
                  <p className="text-sm text-gray-600">
                    {testResults.permissions ? 'Permitido' : 'Denegado'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${testResults.networkTest ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{testResults.networkTest ? 'SUCCESS:' : 'ERROR:'}</span>
                <div>
                  <h3 className="font-medium text-gray-900">Red</h3>
                  <p className="text-sm text-gray-600">
                    {testResults.networkTest ? 'Conectado' : 'Sin conexión'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test de voz */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test de Transcripción</h2>
            
            <button
              onClick={runSpeechTest}
              disabled={isRunningTest || !testResults.browserSupport || !testResults.permissions || !testResults.networkTest}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunningTest 
                  ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                  : testResults.browserSupport && testResults.permissions && testResults.networkTest
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isRunningTest ? 'MIC: Escuchando... (Di "Hola")' : 'Iniciar Test de Voz'}
            </button>

            {testResults.actualTest && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Resultado:</h3>
                <p className="text-sm text-gray-700">{testResults.actualTest}</p>
              </div>
            )}

            {testResults.errorDetails && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">Detalles del Error:</h3>
                <pre className="text-xs text-red-700 whitespace-pre-wrap">{testResults.errorDetails}</pre>
              </div>
            )}
          </div>

          {/* Información del sistema */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Navegador:</strong> {navigator.userAgent.slice(0, 50)}...
              </div>
              <div>
                <strong>Idioma:</strong> {navigator.language}
              </div>
              <div>
                <strong>Conexión:</strong> {navigator.onLine ? 'Online' : 'Offline'}
              </div>
              <div>
                <strong>Speech API:</strong> {window.SpeechRecognition ? 'SpeechRecognition' : window.webkitSpeechRecognition ? 'webkitSpeechRecognition' : 'No disponible'}
              </div>
            </div>
          </div>

          {/* Botón de regreso */}
          <div className="mt-8 text-center">
            <a 
              href="/patient-complete" 
              className="text-blue-600 hover:text-blue-700 underline"
            >
              ← Volver a la aplicación principal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}; 