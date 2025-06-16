/**
 * 📋 PRE-CONSULTATION - Preparación IA
 * Preparación inteligente de consultas con insights predictivos
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

interface PatientProfile {
  id: string;
  name: string;
  age: number;
  condition: string;
  lastVisit: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  treatmentGoals: string[];
  progressNotes: string[];
}

interface AIPreparation {
  suggestedQuestions: string[];
  riskFactors: string[];
  recommendedTests: string[];
  treatmentOptions: string[];
  expectedDuration: number;
  confidenceScore: number;
}

const PreConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [aiPreparation, setAIPreparation] = useState<AIPreparation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    // Simulación de carga de datos del paciente y preparación IA
    const loadPatientData = async () => {
      // Mock data basado en el ID del paciente
      const mockPatient: PatientProfile = {
        id: id || '1',
        name: 'María González',
        age: 45,
        condition: 'Lumbalgia crónica',
        lastVisit: '2024-01-10',
        riskLevel: 'high',
        medicalHistory: [
          'Hernia discal L4-L5 (2022)',
          'Episodios recurrentes de dolor lumbar',
          'Sedentarismo prolongado',
          'Sobrepeso (IMC 28.5)'
        ],
        currentMedications: [
          'Ibuprofeno 600mg (según necesidad)',
          'Paracetamol 1g (según necesidad)',
          'Omeprazol 20mg (protector gástrico)'
        ],
        allergies: [
          'Alergia a penicilina',
          'Intolerancia a lactosa'
        ],
        treatmentGoals: [
          'Reducir dolor de 8/10 a 3/10',
          'Mejorar movilidad lumbar',
          'Fortalecer musculatura core',
          'Retomar actividades laborales'
        ],
        progressNotes: [
          'Sesión anterior: Dolor 6/10, mejoría en flexión',
          'Ejercicios en casa: Adherencia 70%',
          'Última evaluación: Progreso lento pero constante'
        ]
      };

      const mockAIPreparation: AIPreparation = {
        suggestedQuestions: [
          '¿Cómo ha evolucionado el dolor desde la última sesión?',
          '¿Ha realizado los ejercicios en casa regularmente?',
          '¿Ha tenido episodios de dolor nocturno?',
          '¿Qué actividades le generan más molestias?',
          '¿Ha notado irradiación del dolor hacia las piernas?',
          '¿Cómo está su estado de ánimo respecto al tratamiento?',
          '¿Ha tenido que tomar medicamentos para el dolor esta semana?',
          '¿Siente rigidez matutina en la zona lumbar?',
          '¿El dolor interfiere con sus actividades laborales?',
          '¿Ha notado mejoría con las técnicas de relajación?'
        ],
        riskFactors: [
          'Dolor aumentó de 6/10 a 8/10 en última semana',
          'Posible exacerbación aguda',
          'Riesgo de cronificación del dolor',
          'Factores psicosociales: ansiedad por el trabajo'
        ],
        recommendedTests: [
          'Test de Lasègue bilateral',
          'Evaluación de fuerza muscular L4-L5-S1',
          'Test de flexión lumbar (Schober)',
          'Evaluación postural en bipedestación',
          'Test de resistencia muscular core'
        ],
        treatmentOptions: [
          'Terapia manual: movilizaciones vertebrales',
          'Ejercicios de estabilización lumbar',
          'Técnicas de relajación y respiración',
          'Educación en higiene postural',
          'Considerar derivación a psicología del dolor'
        ],
        expectedDuration: 45,
        confidenceScore: 92
      };

      setTimeout(() => {
        setPatient(mockPatient);
        setAIPreparation(mockAIPreparation);
        setIsLoading(false);
      }, 1500);
    };

    loadPatientData();
  }, [id]);

  const handleStartSession = () => {
    // Guardar preparación y navegar a sesión activa
    const preparationData = {
      selectedQuestions,
      selectedTests,
      sessionNotes,
      timestamp: new Date().toISOString()
    };
    
    // Aquí se guardaría en el estado global o localStorage
    localStorage.setItem(`preparation-${id}`, JSON.stringify(preparationData));
    
    navigate(`/patient/${id}/session`);
  };

  const handleBackToSelection = () => {
    navigate('/patient-selection');
  };

  const toggleQuestion = (question: string) => {
    setSelectedQuestions(prev => 
      prev.includes(question) 
        ? prev.filter(q => q !== question)
        : [...prev, question]
    );
  };

  const toggleTest = (test: string) => {
    setSelectedTests(prev => 
      prev.includes(test) 
        ? prev.filter(t => t !== test)
        : [...prev, test]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-[#2C3E50] font-medium">Preparando consulta con IA...</div>
          <div className="text-[#2C3E50]/60 text-sm">Analizando historial y generando insights</div>
        </div>
      </div>
    );
  }

  if (!patient || !aiPreparation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#2C3E50] mb-2">Paciente no encontrado</h2>
          <button onClick={handleBackToSelection} className="btn-primary">
            Volver a selección
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToSelection}
                className="p-2 text-[#2C3E50] hover:bg-[#5DA5A3]/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <AiDuxCareLogo size="sm" />
              <div>
                <h1 className="text-xl font-bold text-[#2C3E50]">Preparación de Consulta</h1>
                <p className="text-[#2C3E50]/60 text-sm">IA preparando insights para {patient.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-[#2C3E50]/60">
                Confianza IA: {aiPreparation.confidenceScore}%
              </div>
              <div className="text-sm text-[#2C3E50]/60">
                Duración estimada: {aiPreparation.expectedDuration}min
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Perfil del Paciente */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#5DA5A3] to-[#4A8280] rounded-full flex items-center justify-center text-white font-bold">
                  {patient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2C3E50]">{patient.name}</h2>
                  <p className="text-sm text-[#2C3E50]/60">{patient.age} años • {patient.condition}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[#2C3E50] mb-2">Historial Médico</h3>
                  <ul className="space-y-1">
                    {patient.medicalHistory.map((item, index) => (
                      <li key={index} className="text-xs text-[#2C3E50]/70 pl-2 border-l-2 border-[#5DA5A3]/20">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#2C3E50] mb-2">Medicación Actual</h3>
                  <ul className="space-y-1">
                    {patient.currentMedications.map((med, index) => (
                      <li key={index} className="text-xs text-[#2C3E50]/70 pl-2 border-l-2 border-[#A8E6CF]/20">
                        • {med}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#FF6F61] mb-2">⚠️ Alergias</h3>
                  <ul className="space-y-1">
                    {patient.allergies.map((allergy, index) => (
                      <li key={index} className="text-xs text-[#FF6F61] pl-2 border-l-2 border-[#FF6F61]/20">
                        • {allergy}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Factores de Riesgo */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <h3 className="text-lg font-bold text-[#FF6F61] mb-4">🚨 Factores de Riesgo IA</h3>
              <div className="space-y-3">
                {aiPreparation.riskFactors.map((risk, index) => (
                  <div key={index} className="p-3 bg-[#FF6F61]/10 rounded-lg border-l-4 border-[#FF6F61]">
                    <p className="text-sm text-[#2C3E50]">{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preparación de la Consulta */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preguntas Sugeridas */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">💬 Preguntas Sugeridas por IA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiPreparation.suggestedQuestions.map((question, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedQuestions.includes(question)
                        ? 'border-[#5DA5A3] bg-[#5DA5A3]/10'
                        : 'border-[#BDC3C7]/30 hover:border-[#5DA5A3]/50'
                    }`}
                    onClick={() => toggleQuestion(question)}
                  >
                    <div className="flex items-start space-x-2">
                      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 ${
                        selectedQuestions.includes(question)
                          ? 'border-[#5DA5A3] bg-[#5DA5A3]'
                          : 'border-[#BDC3C7]'
                      }`}>
                        {selectedQuestions.includes(question) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-[#2C3E50]">{question}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tests Recomendados */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">🔬 Tests Recomendados por IA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiPreparation.recommendedTests.map((test, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTests.includes(test)
                        ? 'border-[#A8E6CF] bg-[#A8E6CF]/10'
                        : 'border-[#BDC3C7]/30 hover:border-[#A8E6CF]/50'
                    }`}
                    onClick={() => toggleTest(test)}
                  >
                    <div className="flex items-start space-x-2">
                      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 ${
                        selectedTests.includes(test)
                          ? 'border-[#A8E6CF] bg-[#A8E6CF]'
                          : 'border-[#BDC3C7]'
                      }`}>
                        {selectedTests.includes(test) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-[#2C3E50]">{test}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opciones de Tratamiento */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">🎯 Opciones de Tratamiento IA</h3>
              <div className="space-y-3">
                {aiPreparation.treatmentOptions.map((option, index) => (
                  <div key={index} className="p-3 bg-[#5DA5A3]/10 rounded-lg border-l-4 border-[#5DA5A3]">
                    <p className="text-sm text-[#2C3E50]">{option}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas de Preparación */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-4">📝 Notas de Preparación</h3>
              <textarea
                className="w-full h-32 p-3 border border-[#BDC3C7]/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#5DA5A3] focus:border-[#5DA5A3]"
                placeholder="Añade notas específicas para esta consulta..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>

            {/* Botón de Inicio */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#2C3E50]">¿Listo para comenzar?</h3>
                  <p className="text-sm text-[#2C3E50]/60">
                    {selectedQuestions.length} preguntas y {selectedTests.length} tests seleccionados
                  </p>
                </div>
                <button
                  onClick={handleStartSession}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Iniciar Consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreConsultationPage; 