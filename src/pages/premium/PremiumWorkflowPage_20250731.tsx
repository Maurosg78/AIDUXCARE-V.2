import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export type MedicalPhase = 'anamnesis' | 'fisica' | 'soap';

export interface SessionMetrics {
  totalChunks: number;
  analyzedChunks: number;
  averageProcessingTime: number;
  clinicalRelevance: number;
  redFlagsCount: number;
  soapCompleteness: {
    S: number;
    O: number;
    A: number;
    P: number;
  };
}

export interface WorkflowState {
  isRecording: boolean;
  currentPhase: MedicalPhase;
  sessionStartTime: number | null;
  sessionDuration: number;
  metrics: SessionMetrics;
}

export const PremiumWorkflowPage_20250731: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<MedicalPhase>('anamnesis');
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Timer para duración de sesión
  useEffect(() => {
    if (!sessionStartTime) return;

    const interval = setInterval(() => {
      setSessionDuration(Date.now() - sessionStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const handleRecordingStart = () => {
    setIsRecording(true);
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
  };

  const handlePhaseChange = (phase: MedicalPhase) => {
    setCurrentPhase(phase);
    
    // Emit phase change para semantic chunking
    window.dispatchEvent(new CustomEvent('medicalPhaseChange', {
      detail: { phase, timestamp: Date.now() }
    }));
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="premium-workflow min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header profesional con degradé */}
      <div className="workflow-header bg-gradient-to-r from-white to-blue-50 shadow-lg border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="session-info">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
                Consulta Clínica Premium
              </h1>
              <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Profesional: {user?.displayName || 'Dr. Usuario'}
                </span>
                <span>Paciente: [Datos anonimizados para demo]</span>
                <span>Duración: {formatDuration(sessionDuration)}</span>
                <span className="flex items-center">
                  Fase: 
                  <span className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs rounded-full font-medium">
                    {currentPhase === 'anamnesis' && '📋 Anamnesis'}
                    {currentPhase === 'fisica' && '🔍 Evaluación Física'}
                    {currentPhase === 'soap' && '📝 Resumen SOAP'}
                  </span>
                </span>
              </div>
            </div>

            <div className="session-controls flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-blue-300"
              >
                Nueva Sesión
              </button>
              <div className={`recording-indicator flex items-center px-4 py-2 rounded-lg border transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-50 text-red-700 border-red-200 shadow-md' 
                  : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                {isRecording ? 'Grabando' : 'Detenido'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal con 3 pestañas */}
      <div className="workflow-content max-w-7xl mx-auto px-4 py-8">
        
        {/* Tabs de navegación premium */}
        <div className="premium-tabs mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-lg border border-gray-200">
            {[
              { phase: 'anamnesis', label: '📋 Anamnesis Clínica', icon: '📋' },
              { phase: 'fisica', label: '🔍 Evaluación Física', icon: '🔍' },
              { phase: 'soap', label: '📝 Resumen Clínico SOAP', icon: '📝' }
            ].map(({ phase, label, icon }) => (
              <button
                key={phase}
                onClick={() => handlePhaseChange(phase as MedicalPhase)}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                  currentPhase === phase
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido específico por pestaña */}
        <div className="tab-content">
          
          {/* PESTAÑA 1: ANAMNESIS CLÍNICA */}
          {currentPhase === 'anamnesis' && (
            <div className="anamnesis-tab bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Anamnesis Clínica</h2>
                  <p className="text-gray-600">Recopilación de datos del paciente</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda: Formulario de anamnesis */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Datos Demográficos</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sexo</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                          <option>Seleccionar...</option>
                          <option>Masculino</option>
                          <option>Femenino</option>
                          <option>No binario</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Motivo de Consulta</h3>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                      rows={4}
                      placeholder="Describa el motivo principal de la consulta..."
                    />
                  </div>
                </div>
                
                {/* Columna derecha: Historial médico */}
                <div className="space-y-6">
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4">Historial Médico</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Antecedentes Patológicos</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" rows={3} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medicamentos Actuales</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" rows={3} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4">Factores de Riesgo</h3>
                    <div className="space-y-2">
                      {['Diabetes', 'Hipertensión', 'Obesidad', 'Tabaquismo', 'Sedentarismo'].map((factor) => (
                        <label key={factor} className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm text-gray-700">{factor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 2: EVALUACIÓN FÍSICA */}
          {currentPhase === 'fisica' && (
            <div className="fisica-tab bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Evaluación Física</h2>
                  <p className="text-gray-600">Examen físico y pruebas funcionales</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda: Signos vitales */}
                <div className="space-y-6">
                  <div className="bg-red-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-4">Signos Vitales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Presión Arterial</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="120/80" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia Cardíaca</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="72" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Temperatura</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="36.5" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="70" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">Exploración Física</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Inspección</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Palpación</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3} />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Columna derecha: Pruebas funcionales */}
                <div className="space-y-6">
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4">Pruebas Funcionales</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rango de Movimiento</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" rows={3} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fuerza Muscular</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" rows={3} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Pruebas Especiales</h3>
                    <div className="space-y-2">
                      {['Test de Lasègue', 'Test de Spurling', 'Test de Neer', 'Test de Hawkins', 'Test de Yergason'].map((test) => (
                        <label key={test} className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm text-gray-700">{test}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: RESUMEN CLÍNICO SOAP */}
          {currentPhase === 'soap' && (
            <div className="soap-tab bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Resumen Clínico SOAP</h2>
                  <p className="text-gray-600">Documentación clínica estructurada</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda: S y O */}
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">S - Subjetivo</h3>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      rows={6}
                      placeholder="Descripción de síntomas por el paciente..."
                    />
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">O - Objetivo</h3>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                      rows={6}
                      placeholder="Hallazgos del examen físico..."
                    />
                  </div>
                </div>
                
                {/* Columna derecha: A y P */}
                <div className="space-y-6">
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4">A - Assessment</h3>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" 
                      rows={6}
                      placeholder="Evaluación clínica y diagnóstico..."
                    />
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4">P - Plan</h3>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                      rows={6}
                      placeholder="Plan de tratamiento y seguimiento..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="mt-8 flex justify-end space-x-4">
                <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  Guardar Borrador
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105">
                  Finalizar Consulta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumWorkflowPage_20250731; 