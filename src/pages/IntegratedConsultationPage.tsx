/**
 * 🏥 AIDUXCARE - VISTA INTEGRADA DE CONSULTA
 * Flujo completo de consulta en una sola interfaz inteligente
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

// Interfaces
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  lastVisit?: string;
  consultationType: 'primera' | 'seguimiento';
  appointmentReason: string;
}

interface MedicalHighlight {
  id: string;
  text: string;
  category: 'symptom' | 'medication' | 'allergy' | 'vital' | 'warning';
  timestamp: string;
  checked: boolean;
  editable: boolean;
}

interface AIQuestion {
  id: string;
  question: string;
  category: 'anamnesis' | 'followup' | 'assessment';
  priority: 'high' | 'medium' | 'low';
  basedOn: string;
}

interface SOAPSection {
  subjective: string;
  objective: string;
  assessment: string;
  plan: TreatmentItem[];
}

interface TreatmentItem {
  id: string;
  description: string;
  checked: boolean;
  editable: boolean;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioQuality: 'excellent' | 'good' | 'poor';
}

const IntegratedConsultationPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // Estados principales
  const [patient, setPatient] = useState<Patient | null>(null);
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioQuality: 'good'
  });
  const [transcription, setTranscription] = useState<string>('');
  const [highlights, setHighlights] = useState<MedicalHighlight[]>([]);
  const [soap, setSOAP] = useState<SOAPSection>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: []
  });
  const [soapStatus, setSOAPStatus] = useState<'draft' | 'preliminary' | 'official'>('draft');

  // Simulación de datos del paciente
  useEffect(() => {
    const mockPatient: Patient = {
      id: patientId || '1',
      name: 'María González',
      age: 45,
      gender: 'Femenino',
      phone: '+56 9 8765 4321',
      email: 'maria.gonzalez@email.com',
      medicalHistory: ['Dolor lumbar crónico', 'Hipertensión controlada'],
      currentMedications: ['Losartán 50mg', 'Ibuprofeno 400mg PRN'],
      allergies: ['Penicilina'],
      lastVisit: '2024-05-15',
      consultationType: 'seguimiento',
      appointmentReason: 'Control dolor lumbar - evaluación progreso ejercicios'
    };

    setPatient(mockPatient);

    const generatedQuestions: AIQuestion[] = [
      {
        id: '1',
        question: '¿Cómo ha evolucionado el dolor lumbar desde la última consulta?',
        category: 'followup',
        priority: 'high',
        basedOn: 'Dolor lumbar crónico + consulta seguimiento'
      },
      {
        id: '2',
        question: '¿Ha realizado los ejercicios de fortalecimiento recomendados?',
        category: 'followup',
        priority: 'high',
        basedOn: 'Motivo cita: evaluación progreso ejercicios'
      }
    ];

    setAiQuestions(generatedQuestions);
  }, [patientId]);

  const toggleRecording = () => {
    if (!recording.isRecording) {
      setRecording(prev => ({ ...prev, isRecording: true, isPaused: false }));
    } else {
      setRecording(prev => ({ ...prev, isRecording: false, isPaused: false }));
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5DA5A3] mx-auto mb-4"></div>
          <p className="text-[#2C3E50]">Cargando información del paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#BDC3C7]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <AiDuxCareLogo size="sm" />
              <div className="h-6 w-px bg-[#BDC3C7]/30"></div>
              <h1 className="text-xl font-semibold text-[#2C3E50]">Consulta Integrada</h1>
            </div>
            <button
              onClick={() => navigate('/patients')}
              className="text-[#5DA5A3] hover:text-[#4A8280] font-medium"
            >
              ← Volver a Pacientes
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Panel Información del Paciente */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-[#BDC3C7]/20 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-[#5DA5A3] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-[#2C3E50]">{patient.name}</h2>
                  <p className="text-sm text-[#2C3E50]/60">{patient.age} años • {patient.gender}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-[#2C3E50] mb-2">Antecedentes</h3>
                  <div className="space-y-1">
                    {patient.medicalHistory.map((history, index) => (
                      <span key={index} className="inline-block bg-[#5DA5A3]/10 text-[#2C3E50] px-2 py-1 rounded-md text-xs mr-1 mb-1">
                        {history}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-[#2C3E50] mb-2">Medicamentos</h3>
                  <div className="space-y-1">
                    {patient.currentMedications.map((med, index) => (
                      <span key={index} className="inline-block bg-blue-50 text-blue-800 px-2 py-1 rounded-md text-xs mr-1 mb-1">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="col-span-12 lg:col-span-9">
            
            {/* Preguntas IA Sugeridas */}
            <div className="bg-white rounded-xl shadow-sm border border-[#BDC3C7]/20 p-6 mb-6">
              <h3 className="font-semibold text-[#2C3E50] mb-4">Preguntas Sugeridas por IA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiQuestions.map((question) => (
                  <div key={question.id} className="bg-[#5DA5A3]/5 border border-[#5DA5A3]/20 rounded-lg p-3">
                    <p className="text-sm text-[#2C3E50] mb-2">{question.question}</p>
                    <p className="text-xs text-[#2C3E50]/60">
                      <span className="font-medium">Basado en:</span> {question.basedOn}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tres Recuadros Principales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              
              {/* 1. Grabación */}
              <div className="bg-white rounded-xl shadow-sm border border-[#BDC3C7]/20 p-6">
                <h3 className="font-semibold text-[#2C3E50] mb-4">Grabación</h3>
                
                <div className="text-center space-y-4">
                  <div className="text-3xl font-mono text-[#2C3E50]">
                    {formatDuration(recording.duration)}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={toggleRecording}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        recording.isRecording 
                          ? 'bg-[#FF6F61] text-white hover:bg-[#E55A4F]'
                          : 'bg-[#5DA5A3] text-white hover:bg-[#4A8280]'
                      }`}
                    >
                      {recording.isRecording ? 'Detener' : 'Iniciar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Transcripción */}
              <div className="bg-white rounded-xl shadow-sm border border-[#BDC3C7]/20 p-6">
                <h3 className="font-semibold text-[#2C3E50] mb-4">Transcripción</h3>
                
                <div className="bg-[#F7F7F7] rounded-lg p-4 min-h-[200px]">
                  {transcription ? (
                    <p className="text-sm text-[#2C3E50]">{transcription}</p>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#2C3E50]/60">
                      <p className="text-sm">Inicia la grabación para ver la transcripción</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Checklist */}
              <div className="bg-white rounded-xl shadow-sm border border-[#BDC3C7]/20 p-6">
                <h3 className="font-semibold text-[#2C3E50] mb-4">Highlights Médicos</h3>
                
                <div className="text-center text-[#2C3E50]/60 py-8">
                  <p className="text-sm">Los highlights aparecerán durante la transcripción</p>
                </div>
              </div>
            </div>

            {/* SOAP Dinámico */}
            <div className="bg-white rounded-xl shadow-sm border border-[#BDC3C7]/20 p-6">
              <h3 className="font-semibold text-[#2C3E50] mb-6">Nota SOAP</h3>
              
              <div className="text-center py-12 text-[#2C3E50]/60">
                <p className="text-lg font-medium mb-2">Nota SOAP</p>
                <p className="text-sm">Selecciona highlights médicos y genera la nota SOAP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedConsultationPage; 