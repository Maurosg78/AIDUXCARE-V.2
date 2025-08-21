import React from 'react';

const DebugPage: React.FC = () => {
  const envVars = {
    'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
    'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY ? 'PRESENTE' : 'AUSENTE',
    'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID,
  };

  console.log('=== DIAGNÓSTICO DE VARIABLES DE ENTORNO ===');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  const isUAT = import.meta.env.VITE_FIREBASE_PROJECT_ID?.includes('uat') || false;
  const isPROD = import.meta.env.VITE_FIREBASE_PROJECT_ID === 'aiduxcare-mvp-prod';

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Diagnóstico de variables de entorno</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado de Configuración</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${isUAT ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border-2`}>
              <h3 className="font-semibold">UAT ({import.meta.env.VITE_FIREBASE_PROJECT_ID})</h3>
              <p className={isUAT ? 'text-green-700' : 'text-red-700'}>
                {isUAT ? '✅ ACTIVO' : '❌ INACTIVO'}
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${isPROD ? 'bg-red-100 border-red-500' : 'bg-gray-100 border-gray-300'} border-2`}>
              <h3 className="font-semibold">PROD (aiduxcare-mvp-prod)</h3>
              <p className={isPROD ? 'text-red-700' : 'text-gray-700'}>
                {isPROD ? '❌ ACTIVO (PROBLEMA)' : '✅ INACTIVO'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Variables de Entorno</h2>
          
          <div className="space-y-3">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-mono text-sm">{key}</span>
                <span className={`font-mono text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                  {value || 'AUSENTE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instrucciones</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Abre la consola del navegador (F12)</li>
            <li>Verifica los logs de &quot;DIAGNÓSTICO DE VARIABLES DE ENTORNO&quot;</li>
            <li>Si alguna variable está vacía, hay un problema de carga</li>
            <li>Si el proyecto es PROD, necesitamos reiniciar el servidor</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
