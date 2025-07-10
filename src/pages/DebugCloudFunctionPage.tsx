import { useState } from 'react';

interface DebugResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

interface DebugError {
  code: string;
  message: string;
  details?: unknown;
}

export default function DebugCloudFunctionPage() {
  const [response, setResponse] = useState<DebugResponse | null>(null);
  const [error, setError] = useState<DebugError | null>(null);

  const handleTest = async () => {
    try {
      // Simular una llamada a la función
      const testResponse: DebugResponse = {
        success: true,
        message: 'Test exitoso'
      };
      setResponse(testResponse);
      setError(null);
    } catch (err) {
      const debugError: DebugError = {
        code: 'TEST_ERROR',
        message: err instanceof Error ? err.message : 'Error desconocido'
      };
      setError(debugError);
      setResponse(null);
    }
  };

  return (
    <div className="debug-page">
      <h1>Debug Cloud Function</h1>
      <button onClick={handleTest}>Probar función</button>
      {response && (
        <div className="response">
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div className="error">
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
} 