/**
 * 🏥 Patient Detail Page - AiDuxCare V.2
 * Página de detalle del paciente con interfaz profesional y degradados
 * Corresponde exactamente a la imagen mostrada con tabs de fase clínica
 */

import React, { useState } from 'react';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

interface PatientData {
  name: string;
  age: number;
  chiefComplaint: string;
  lastVisit: string;
  treatment: string;
  allergies: string;
  medications: string;
  previousAlerts: string;
}

export const PatientDetailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'anamnesis' | 'evaluacion' | 'resumen'>('anamnesis');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Datos del paciente correspondientes a la imagen
  const patientData: PatientData = {
    name: 'María González',
    age: 45,
    chiefComplaint: 'Dolor cervical irradiado',
    lastVisit: '15 Ene 2025',
    treatment: 'Ejercicios cervicales, tecarterapia',
    allergies: 'Penicilina',
    medications: 'Ibuprofeno 400mg cada 8h',
    previousAlerts: 'Hipertensión controlada'
  };

  // Timer para grabación
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con degradado purple-blue */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <AiDuxCareLogo size="md" variant="full" className="text-white" />
              <div>
                <h1 className="text-xl font-semibold">
                  Asistente clínico impulsado por inteligencia artificial
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-semibold">Profesional</div>
                <div className="text-sm opacity-90">Fisioterapia</div>
              </div>
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center font-bold">
                MS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { id: 'anamnesis', label: 'Anamnesis Clínica' },
              { id: 'evaluacion', label: 'Evaluación Física' },
              { id: 'resumen', label: 'Resumen Clínico' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'anamnesis' | 'evaluacion' | 'resumen')}
                className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Información del paciente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {patientData.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><span className="font-medium">{patientData.age} años</span></p>
                  <p><span className="font-medium">Motivo:</span> {patientData.chiefComplaint}</p>
                  <p><span className="font-medium">Última visita:</span> {patientData.lastVisit}</p>
                  <p><span className="font-medium">Tratamiento:</span> {patientData.treatment}</p>
                </div>
                <div>
                  <p><span className="font-medium">Alergias:</span> {patientData.allergies}</p>
                  <p><span className="font-medium">Medicamentos:</span> {patientData.medications}</p>
                  <p><span className="font-medium">Alertas previas:</span> {patientData.previousAlerts}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'anamnesis' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Anamnesis Clínica</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Historia Actual</h4>
                  <p className="text-blue-800 text-sm">
                    Paciente refiere dolor cervical de 3 semanas de evolución, 
                    con irradiación hacia hombro derecho. El dolor se agrava con 
                    movimientos de rotación y flexión cervical.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Antecedentes</h4>
                  <p className="text-green-800 text-sm">
                    Hipertensión arterial controlada, sin antecedentes quirúrgicos 
                    relevantes. Trabajo sedentario como administrativa.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evaluacion' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Evaluación Física</h3>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Exploración</h4>
                  <p className="text-yellow-800 text-sm">
                    Limitación de movilidad cervical en rotación derecha (50% del rango normal). 
                    Dolor a la palpación en musculatura cervical posterior derecha. 
                    Test de Spurling positivo en lado derecho.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Tests Específicos</h4>
                  <p className="text-purple-800 text-sm">
                    Test de compresión cervical positivo, test de tracción cervical 
                    alivia síntomas. Fuerza muscular preservada en extremidades superiores.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resumen' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen Clínico</h3>
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">S (Subjetivo)</h4>
                  <p className="text-red-800 text-sm">
                    Dolor cervical irradiado hacia hombro derecho, de 3 semanas de evolución. 
                    Agravado por movimientos cervicales.
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">O (Objetivo)</h4>
                  <p className="text-blue-800 text-sm">
                    Limitación de movilidad cervical, dolor a la palpación, 
                    tests de compresión y Spurling positivos.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">A (Assessment)</h4>
                  <p className="text-green-800 text-sm">
                    Cervicalgia mecánica con posible componente radicular derecho. 
                    Compatible con síndrome facetario cervical.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">P (Plan)</h4>
                  <p className="text-purple-800 text-sm">
                    Terapia manual cervical, ejercicios de movilidad progresiva, 
                    educación postural y control evolutivo en 1 semana.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de acciones inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                }`}
              >
                {isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
                <div className={`w-3 h-3 rounded-full ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {isRecording ? 'Grabando...' : 'Listo para grabar'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-5 h-5 bg-gray-600 rounded-sm"></div>
                <span className="text-xs text-gray-600 mt-1">Cámara</span>
              </button>
              <button className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-5 h-5 bg-gray-600 rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-sm"></div>
                </div>
                <span className="text-xs text-gray-600 mt-1">Subir</span>
              </button>
              <button className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-5 h-5 bg-gray-600 rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">B</span>
                </div>
                <span className="text-xs text-gray-600 mt-1">Bluetooth</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 