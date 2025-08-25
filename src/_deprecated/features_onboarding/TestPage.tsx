import React from 'react';

export const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          🧪 Página de Prueba
        </h1>
        <p className="text-gray-700">
          Si puedes ver esto, el servidor está funcionando correctamente.
        </p>
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p className="text-green-800">
            ✅ Servidor funcionando<br/>
            ✅ React funcionando<br/>
            ✅ TypeScript funcionando
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
