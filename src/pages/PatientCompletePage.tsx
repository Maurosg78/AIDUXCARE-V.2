/**
 * 🏥 Patient Complete Page - AiDuxCare V.2
 * Layout Conceptual: Header Unificado + Área de Trabajo Principal
 * Estado: LIMPIO - Sin pestañas ni tarjetas
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebSpeechSTTService } from '../services/WebSpeechSTTService';

// ========= TIPOS E INTERFACES =========

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  lastVisit: string;
  riskLevel: 'bajo' | 'medio' | 'alto';
  allergies: string[];
  medications: CurrentMedication[];
  clinicalHistory: string;
}

interface CurrentMedication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  status: 'activo' | 'suspendido' | 'temporal';
  interactions: string[];
}

interface ClinicalHighlight {
  id: string;
  text: string;
  category: 'síntoma' | 'hallazgo' | 'plan' | 'advertencia';
  confidence: number;
  timestamp: string;
  isSelected: boolean;
}

// Tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ========= COMPONENTE PRINCIPAL =========

const PatientCompletePage: React.FC = () => {
  const navigate = useNavigate();

  // ========= DATOS DEL PACIENTE =========  
  const [patientData, setPatientData] = useState<PatientData>({
    id: "",
    name: "Seleccionar paciente",
    age: 0,
    gender: "",
    condition: "",
    lastVisit: "",
    riskLevel: "bajo",
    allergies: [],
    medications: [],
    clinicalHistory: ""
  });

  // ========= DETECCIÓN AUTOMÁTICA STT =========
  const [sttAvailable, setSTTAvailable] = useState<boolean | null>(null);
  const [sttTestCompleted, setSTTTestCompleted] = useState(false);

  // ========= ESTADO DE SESIÓN =========
  const [isListening, setIsListening] = useState(false);
  const [highlights, setHighlights] = useState<ClinicalHighlight[]>([]);
  const [soapContent, setSOAPContent] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [recognition, setRecognition] = useState<any>(null);

  // Cargar datos del paciente al montar
  useEffect(() => {
    const loadPatientData = () => {
      try {
        const currentPatientData = localStorage.getItem('aiduxcare_current_patient');
        if (currentPatientData) {
          const patient = JSON.parse(currentPatientData);
          setPatientData({
            id: patient.id || "",
            name: patient.name || "Paciente sin nombre",
            age: patient.age || 0,
            gender: "",
            condition: patient.condition || "",
            lastVisit: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "",
            riskLevel: "bajo",
            allergies: patient.allergies || [],
            medications: [],
            clinicalHistory: patient.clinicalHistory || ""
          });
        }
      } catch (error) {
        console.error('❌ Error al cargar datos del paciente:', error);
      }
    };

    loadPatientData();
    performSTTConnectivityTest();
  }, []);

  // ========= TEST DE CONECTIVIDAD STT SILENCIOSO =========
  const performSTTConnectivityTest = useCallback(async () => {
    console.log('🔍 Iniciando test de conectividad STT silencioso...');
    
    try {
      if (!WebSpeechSTTService.isSupported()) {
        console.log('❌ Navegador no soporta Web Speech API');
        setSTTAvailable(false);
        setSTTTestCompleted(true);
        return;
      }

      if (!navigator.onLine) {
        console.log('❌ Sin conexión a internet');
        setSTTAvailable(false);
        setSTTTestCompleted(true);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('https://speech.googleapis.com', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('✅ Servicios de Google Speech accesibles');
      setSTTAvailable(true);
      
    } catch (error) {
      console.log('❌ Servicios de Google Speech no accesibles:', error);
      setSTTAvailable(false);
    } finally {
      setSTTTestCompleted(true);
      console.log('🏁 Test de conectividad STT completado');
    }
  }, []);

  if (!patientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER NAVIGATION */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-0">Consulta Completa</h2>
                <p className="text-sm text-gray-600 mb-0">AiDuxCare V.2</p>
              </div>
            </div>

            {/* STATUS INDICATOR */}
            <div className="flex items-center space-x-4">
              {!sttTestCompleted && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-600 mb-0">Verificando STT...</p>
                </div>
              )}
              
              {sttTestCompleted && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${sttAvailable ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <p className="text-sm text-gray-600 mb-0">
                    {sttAvailable ? 'Transcripción Automática' : 'Modo Manual'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PATIENT HEADER UNIFICADO */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{patientData.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-lg text-gray-600">{patientData.age} años</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-lg text-gray-600">{patientData.condition || 'Consulta general'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE - LIMPIO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <h3 className="text-xl font-medium mb-2">Área de Trabajo Principal</h3>
            <p className="text-sm">Layout limpio - Listo para construcción supervisada</p>
            <div className="mt-4 text-xs text-gray-400">
              Sin pestañas • Sin tarjetas • Solo header + contenedor principal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCompletePage; 