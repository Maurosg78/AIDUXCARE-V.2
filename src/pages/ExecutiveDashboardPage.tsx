import React from 'react';

const ExecutiveDashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Dashboard Ejecutivo - AiDuxCare
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">ARR Anual</h3>
              <p className="text-3xl font-bold">€213,528</p>
              <p className="text-sm opacity-90">+32% crecimiento</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Usuarios Activos</h3>
              <p className="text-3xl font-bold">287</p>
              <p className="text-sm opacity-90">+18% este mes</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">ARPU</h3>
              <p className="text-3xl font-bold">€62</p>
              <p className="text-sm opacity-90">Por usuario/mes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Planes Especializados
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Psychology Pro</span>
                  <span className="font-semibold text-purple-600">€79/mes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Physio Pro</span>
                  <span className="font-semibold text-blue-600">€69/mes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">General Pro</span>
                  <span className="font-semibold text-green-600">€59/mes</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Métricas Clave
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">LTV/CAC Ratio</span>
                  <span className="font-semibold text-green-600">4.2x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Margen Bruto</span>
                  <span className="font-semibold text-green-600">64%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Break-even</span>
                  <span className="font-semibold text-blue-600">Mes 15</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Dashboard ejecutivo con métricas en tiempo real para inversores y equipo directivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboardPage;
