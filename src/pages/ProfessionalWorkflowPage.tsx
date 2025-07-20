import React, { useState } from 'react';
import ClinicalInfoPage from './ClinicalInfoPage';
import HumanFigurePage from './HumanFigurePage';
import SOAPEditorPage from './SOAPEditorPage';

type ActiveTab = 'clinical' | 'figure' | 'soap';

export const ProfessionalWorkflowPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('clinical');
  const [patientId] = useState('P001');

  const tabs = [
    {
      id: 'clinical' as ActiveTab,
      name: 'Pestaña 1 - Info Clínica',
      description: 'Datos personales, historial médico y medicamentos',
      color: 'blue'
    },
    {
      id: 'figure' as ActiveTab,
      name: 'Pestaña 2 - Figura Humana',
      description: 'Mapa de dolor y batería de tests clínicos',
      color: 'green'
    },
    {
      id: 'soap' as ActiveTab,
      name: 'Pestaña 3 - SOAP',
      description: 'Nota clínica editable y generación de PDF',
      color: 'pink'
    }
  ];

  const getTabColor = (tabId: ActiveTab) => {
    const tab = tabs.find(t => t.id === tabId);
    switch (tab?.color) {
      case 'blue': return '#3498DB';
      case 'green': return '#10B981';
      case 'pink': return '#EC4899';
      default: return '#BDC3C7';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'clinical':
        return <ClinicalInfoPage />;
      case 'figure':
        return <HumanFigurePage />;
      case 'soap':
        return <SOAPEditorPage patientId={patientId} />;
      default:
        return <ClinicalInfoPage />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border" style={{ borderColor: '#BDC3C7' }}>
      {/* Header con Tabs */}
      <div className="p-6 border-b" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2C3E50' }}>
              Flujo de Trabajo Profesional
            </h1>
            <p className="text-sm mt-1" style={{ color: '#BDC3C7' }}>
              Paciente: {patientId} - {new Date().toLocaleDateString('es-CL')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Sesión Activa
            </span>
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors">
              Finalizar Sesión
            </button>
          </div>
        </div>

        {/* Tabs de Navegación */}
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? getTabColor(tab.id) : 'transparent',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <div className="text-center">
                <div className="font-semibold">{tab.name}</div>
                <div className="text-xs opacity-80 mt-1">{tab.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>

      {/* Footer con Progreso */}
      <div className="p-4 border-t bg-gray-50" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs" style={{ color: '#2C3E50' }}>
                {activeTab === 'clinical' && 'Información Clínica Completada'}
                {activeTab === 'figure' && 'Evaluación Visual en Progreso'}
                {activeTab === 'soap' && 'Documentación Final'}
              </span>
            </div>
            <div className="text-xs" style={{ color: '#BDC3C7' }}>
              Progreso: {
                activeTab === 'clinical' ? '33%' :
                activeTab === 'figure' ? '66%' : '100%'
              }
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const currentIndex = tabs.findIndex(t => t.id === activeTab);
                if (currentIndex > 0) {
                  setActiveTab(tabs[currentIndex - 1].id);
                }
              }}
              disabled={activeTab === 'clinical'}
              className="px-3 py-1 text-xs border rounded transition-colors disabled:opacity-50"
              style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
            >
              Anterior
            </button>
            <button
              onClick={() => {
                const currentIndex = tabs.findIndex(t => t.id === activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1].id);
                }
              }}
              disabled={activeTab === 'soap'}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalWorkflowPage; 