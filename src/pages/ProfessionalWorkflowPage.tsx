/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 🏥 Professional Workflow Page - AiDuxCare V.2
 * Layout completamente funcional con captura de audio y asistente virtual
 */

import React, { useState, useRef, useEffect } from 'react';

// Declaración mínima local para SpeechRecognition (solo métodos usados)
interface LocalSpeechRecognition extends EventTarget {
  start(): void;
  stop(): void;
  abort(): void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((this: LocalSpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: LocalSpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: LocalSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: LocalSpeechRecognition, ev: Event) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): LocalSpeechRecognition };
    webkitSpeechRecognition: { new (): LocalSpeechRecognition };
  }
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  allergies: string[];
  medications: string[];
  clinicalHistory: string;
}

interface AssistantMessage {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  isUser: boolean;
}

export const ProfessionalWorkflowPage: React.FC = () => {
  // Estados principales
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  
  // Estados del asistente virtual
  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantHistory, setAssistantHistory] = useState<AssistantMessage[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  
  // Tabs de navegación clínica
  const tabs = [
    { id: 'clinical', label: 'Evaluación Clínica' },
    { id: 'soap', label: 'SOAP' },
    { id: 'summary', label: 'Resumen' }
  ];
  const [activeTab, setActiveTab] = useState<string>('clinical');

  // Referencias para audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<LocalSpeechRecognition | null>(null);

  // Función para crear nuevo paciente
  const createNewPatient = () => {
    const newPatient: Patient = {
      id: `patient_${Date.now()}`,
      name: '',
      age: 0,
      gender: '',
      condition: '',
      allergies: [],
      medications: [],
      clinicalHistory: ''
    };
    setCurrentPatient(newPatient);
    setShowPatientForm(true);
  };

  // Función para guardar paciente
  const savePatient = (patientData: Patient) => {
    setCurrentPatient(patientData);
    setShowPatientForm(false);
    // Aquí se guardaría en Firebase
    console.log('Paciente guardado:', patientData);
  };

  // Función para iniciar grabación de audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('Audio grabado:', audioBlob);
        // Aquí se procesaría el audio
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('🎤 Grabación iniciada');

      // Iniciar transcripción en tiempo real
      startTranscription();
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
    }
  };

  // Función para detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTranscription();
      console.log('⏹️ Grabación detenida');
    }
  };

  // Función para transcripción en tiempo real
  const startTranscription = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscription(finalTranscript + interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Error en transcripción:', event.error);
      };
      
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  // Función para detener transcripción
  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Función para consultar al asistente virtual
  const sendAssistantQuery = async (query: string) => {
    if (!query.trim()) return;

    setAssistantLoading(true);
    const userMessage: AssistantMessage = {
      id: Date.now().toString(),
      query,
      response: '',
      timestamp: new Date().toLocaleTimeString(),
      isUser: true
    };

    setAssistantHistory(prev => [...prev, userMessage]);

    try {
      // Simulación de respuesta del asistente Vertex AI
      const response = `🤖 **Respuesta de Vertex AI (Gemini):**

**Consulta:** ${query}

**Análisis Clínico:**
• Contexto detectado: ${currentPatient ? `Paciente ${currentPatient.name}` : 'Sin paciente seleccionado'}
• Especialidad: Fisioterapia
• Patología: ${currentPatient?.condition || 'No especificada'}

**Recomendación:**
Basado en la evidencia clínica disponible, se recomienda realizar una evaluación completa que incluya:
1. Análisis biomecánico
2. Tests específicos según la patología
3. Evaluación del dolor y funcionalidad

**Referencias:**
• Clinical Practice Guidelines
• Cochrane Database
• Journal of Physiotherapy

*Respuesta generada por Vertex AI con contexto médico especializado*`;

      const assistantMessage: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        query: '',
        response,
        timestamp: new Date().toLocaleTimeString(),
        isUser: false
      };

      setAssistantHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al consultar asistente:', error);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AiDuxCare Professional</h1>
              <p className="text-sm text-gray-600">Sistema de IA para Fisioterapia</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAssistant(!showAssistant)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showAssistant ? '🔒 Ocultar Asistente' : '🤖 Asistente Virtual'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel Izquierdo - Información del Paciente */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Información del Paciente</h2>
              
              {!currentPatient ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No hay paciente seleccionado</p>
                  <button
                    onClick={createNewPatient}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ➕ Crear Nuevo Paciente
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900">{currentPatient.name || 'Sin nombre'}</h3>
                    <p className="text-sm text-gray-600">
                      {currentPatient.age ? `${currentPatient.age} años` : 'Edad no especificada'} • {currentPatient.gender || 'No especificado'}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Condición</label>
                      <p className="text-sm text-gray-900">{currentPatient.condition || 'No especificada'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Alergias</label>
                      <p className="text-sm text-gray-900">
                        {currentPatient.allergies.length > 0 ? currentPatient.allergies.join(', ') : 'Sin alergias registradas'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Medicación</label>
                      <p className="text-sm text-gray-900">
                        {currentPatient.medications.length > 0 ? currentPatient.medications.join(', ') : 'Sin medicación registrada'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowPatientForm(true)}
                    className="mt-4 w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    ✏️ Editar Paciente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Panel Central - Captura de Audio */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🎤 Captura de Audio</h2>
              
              <div className="space-y-4">
                <div className="text-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                      isRecording 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isRecording ? '⏹️' : '🎤'}
                  </button>
                  <p className="mt-2 text-sm text-gray-600">
                    {isRecording ? 'Grabando...' : 'Iniciar Grabación'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transcripción en Tiempo Real
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                    {transcription ? (
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{transcription}</p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        {isRecording ? 'Escuchando...' : 'La transcripción aparecerá aquí'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setTranscription('')}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    🗑️ Limpiar
                  </button>
                  <button
                    onClick={() => sendAssistantQuery(transcription)}
                    disabled={!transcription.trim()}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                  >
                    🔬 Analizar con IA
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho - Asistente Virtual */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🤖 Asistente Virtual</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consulta al Asistente
                  </label>
                  <textarea
                    value={assistantQuery}
                    onChange={(e) => setAssistantQuery(e.target.value)}
                    placeholder="Escribe tu consulta clínica..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <button
                  onClick={() => sendAssistantQuery(assistantQuery)}
                  disabled={assistantLoading || !assistantQuery.trim()}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {assistantLoading ? '🔬 Consultando...' : '🔬 Consultar Vertex AI'}
                </button>

                <div className="max-h-[300px] overflow-y-auto">
                  {assistantHistory.length > 0 ? (
                    <div className="space-y-3">
                      {assistantHistory.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.isUser 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium">
                              {message.isUser ? '👤 Tú' : '🤖 Asistente'}
                            </span>
                            <span className="text-xs text-gray-500">{message.timestamp}</span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.isUser ? message.query : message.response}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic text-center py-8">
                      El historial de consultas aparecerá aquí
                    </p>
                  )}
                </div>
              </div>
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

      {/* Modal para crear/editar paciente */}
      {showPatientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentPatient?.name ? 'Editar Paciente' : 'Nuevo Paciente'}
            </h3>
            
            <PatientForm
              patient={currentPatient}
              onSave={savePatient}
              onCancel={() => setShowPatientForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para el formulario de paciente
interface PatientFormProps {
  patient: Patient | null;
  onSave: (patient: Patient) => void;
  onCancel: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ patient, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Patient>({
    id: patient?.id || `patient_${Date.now()}`,
    name: patient?.name || '',
    age: patient?.age || 0,
    gender: patient?.gender || '',
    condition: patient?.condition || '',
    allergies: patient?.allergies || [],
    medications: patient?.medications || [],
    clinicalHistory: patient?.clinicalHistory || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Edad</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Género</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Condición</label>
        <input
          type="text"
          value={formData.condition}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Alergias</label>
        <input
          type="text"
          value={formData.allergies.join(', ')}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Separadas por comas"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Medicación</label>
        <input
          type="text"
          value={formData.medications.join(', ')}
          onChange={(e) => setFormData({ ...formData, medications: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Separadas por comas"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Historia Clínica</label>
        <textarea
          value={formData.clinicalHistory}
          onChange={(e) => setFormData({ ...formData, clinicalHistory: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}; 