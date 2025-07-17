/**
 * 🏥 Physiotherapy Case Evaluator - AiDuxCare V.2
 * Evaluador de casos de fisioterapia de diferentes complejidades
 */

import React, { useState, useEffect } from 'react';

interface PhysioCase {
  id: string;
  title: string;
  complexity: 'baja' | 'media' | 'alta' | 'crítica';
  category: 'ortopédica' | 'neurológica' | 'cardiorrespiratoria' | 'deportiva' | 'geriátrica' | 'pediátrica';
  patientInfo: {
    name: string;
    age: number;
    gender: string;
    occupation: string;
    comorbidities: string[];
  };
  symptoms: string[];
  clinicalHistory: string;
  redFlags: string[];
  contraindications: string[];
  assessment: {
    subjective: string;
    objective: string;
    tests: Array<{ name: string; result: string; notes: string }>;
  };
  treatment: {
    goals: string[];
    interventions: string[];
    precautions: string[];
    followUp: string;
  };
  expectedOutcomes: string[];
  timeline: string;
}

interface EvaluationMetrics {
  caseId: string;
  accuracy: number;
  completeness: number;
  clinicalReasoning: number;
  safetyScore: number;
  timeToComplete: number;
  suggestions: string[];
  overallScore: number;
}

const PhysiotherapyCaseEvaluator: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<PhysioCase | null>(null);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationMetrics | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState<'cases' | 'evaluation' | 'results'>('cases');

  // Casos de fisioterapia de diferentes complejidades
  const physioCases: PhysioCase[] = [
    // CASO BAJA COMPLEJIDAD - Lumbalgia mecánica
    {
      id: 'FT-001',
      title: 'Lumbalgia mecánica aguda',
      complexity: 'baja',
      category: 'ortopédica',
      patientInfo: {
        name: 'Carlos Mendoza',
        age: 35,
        gender: 'masculino',
        occupation: 'Oficinista',
        comorbidities: ['Obesidad leve']
      },
      symptoms: [
        'Dolor lumbar agudo de 3 días',
        'Dolor irradiado a glúteo derecho',
        'Limitación flexión anterior',
        'Dolor al sentarse prolongado'
      ],
      clinicalHistory: 'Episodio similar hace 6 meses, resuelto con reposo. Sin cirugías previas.',
      redFlags: [
        'Dolor nocturno intenso',
        'Pérdida de peso reciente',
        'Antecedentes de cáncer'
      ],
      contraindications: [
        'Manipulaciones vertebrales en fase aguda',
        'Ejercicios de alta intensidad'
      ],
      assessment: {
        subjective: 'Paciente refiere dolor lumbar agudo de 3 días de evolución, sin traumatismo previo. Dolor tipo mecánico que mejora con reposo y empeora con movimientos de flexión.',
        objective: 'Antalgia en flexión anterior, test de Lasègue negativo, fuerza muscular conservada, reflejos normales.',
        tests: [
          { name: 'Test de Lasègue', result: 'Negativo', notes: 'No reproduce dolor radicular' },
          { name: 'Test de Schober', result: 'Limitado', notes: 'Flexión lumbar 2cm' },
          { name: 'Palpación', result: 'Dolor L4-L5', notes: 'Hipertonía muscular paravertebral' }
        ]
      },
      treatment: {
        goals: [
          'Reducir dolor agudo',
          'Mejorar movilidad lumbar',
          'Educar en higiene postural',
          'Prevenir recidivas'
        ],
        interventions: [
          'Crioterapia inicial',
          'Ejercicios de estabilización lumbar',
          'Educación postural',
          'Progresión gradual de actividad'
        ],
        precautions: [
          'Evitar flexiones repetitivas',
          'No levantar pesos >5kg',
          'Mantener lordosis lumbar'
        ],
        followUp: 'Reevaluación en 1 semana'
      },
      expectedOutcomes: [
        'Reducción 70% del dolor en 2 semanas',
        'Retorno al trabajo en 1 mes',
        'Independencia en programa de ejercicios'
      ],
      timeline: '4-6 semanas'
    },

    // CASO MEDIA COMPLEJIDAD - Hombro doloroso
    {
      id: 'FT-002',
      title: 'Síndrome de pinzamiento subacromial',
      complexity: 'media',
      category: 'ortopédica',
      patientInfo: {
        name: 'Ana Rodríguez',
        age: 52,
        gender: 'femenino',
        occupation: 'Pintora',
        comorbidities: ['Diabetes tipo 2', 'Hipertensión']
      },
      symptoms: [
        'Dolor hombro derecho 6 meses',
        'Dolor en arco doloroso 60-120°',
        'Dolor nocturno',
        'Limitación actividades cotidianas'
      ],
      clinicalHistory: 'Síntomas progresivos, sin traumatismo. Tratamiento previo con AINEs sin mejoría.',
      redFlags: [
        'Dolor constante sin variación',
        'Pérdida de fuerza progresiva',
        'Síntomas sistémicos'
      ],
      contraindications: [
        'Movilizaciones agresivas',
        'Ejercicios por encima de 90° inicialmente'
      ],
      assessment: {
        subjective: 'Paciente refiere dolor en hombro derecho de 6 meses de evolución, progresivo, que limita actividades de la vida diaria y trabajo.',
        objective: 'Dolor en arco doloroso 60-120°, test de Neer positivo, test de Hawkins positivo, fuerza muscular disminuida en rotadores externos.',
        tests: [
          { name: 'Test de Neer', result: 'Positivo', notes: 'Reproduce dolor subacromial' },
          { name: 'Test de Hawkins', result: 'Positivo', notes: 'Dolor en rotación interna' },
          { name: 'Test de Jobe', result: 'Positivo', notes: 'Debilidad rotadores externos' },
          { name: 'Rango de movimiento', result: 'Limitado', notes: 'Flexión 120°, abducción 100°' }
        ]
      },
      treatment: {
        goals: [
          'Reducir dolor e inflamación',
          'Mejorar rango de movimiento',
          'Fortalecer musculatura del hombro',
          'Restaurar función completa'
        ],
        interventions: [
          'Terapia manual subacromial',
          'Ejercicios de Codman',
          'Fortalecimiento progresivo rotadores',
          'Educación ergonómica'
        ],
        precautions: [
          'Evitar movimientos repetitivos por encima de la cabeza',
          'Progresión gradual de ejercicios',
          'Monitorear respuesta al ejercicio'
        ],
        followUp: 'Reevaluación en 2 semanas'
      },
      expectedOutcomes: [
        'Reducción 50% del dolor en 4 semanas',
        'Mejora del rango de movimiento en 6 semanas',
        'Retorno progresivo a actividades'
      ],
      timeline: '8-12 semanas'
    },

    // CASO ALTA COMPLEJIDAD - ACV
    {
      id: 'FT-003',
      title: 'Secuelas de ACV hemiparesia derecha',
      complexity: 'alta',
      category: 'neurológica',
      patientInfo: {
        name: 'Roberto Silva',
        age: 68,
        gender: 'masculino',
        occupation: 'Jubilado',
        comorbidities: ['Hipertensión', 'Diabetes', 'Fibrilación auricular']
      },
      symptoms: [
        'Hemiparesia derecha',
        'Alteración equilibrio',
        'Disfagia leve',
        'Alteración marcha',
        'Dolor hombro derecho'
      ],
      clinicalHistory: 'ACV isquémico hace 3 meses, ingreso hospitalario 15 días. Alta con hemiparesia derecha.',
      redFlags: [
        'Deterioro neurológico súbito',
        'Dolor torácico',
        'Alteración nivel de consciencia',
        'Signos de trombosis venosa'
      ],
      contraindications: [
        'Movilizaciones pasivas agresivas',
        'Ejercicios que aumenten presión intracraneal',
        'Posiciones que comprometan vía aérea'
      ],
      assessment: {
        subjective: 'Paciente refiere dificultad para caminar, pérdida de fuerza en lado derecho, dolor en hombro derecho.',
        objective: 'Hemiparesia derecha, espasticidad moderada, alteración equilibrio, marcha inestable, dolor hombro subluxado.',
        tests: [
          { name: 'Escala de Ashworth', result: 'Grado 2', notes: 'Espasticidad en flexores' },
          { name: 'Test de Berg', result: '32/56', notes: 'Alteración equilibrio moderada' },
          { name: 'Fugl-Meyer', result: '45/100', notes: 'Alteración función motora' },
          { name: 'Timed Up and Go', result: '25 segundos', notes: 'Alteración marcha' }
        ]
      },
      treatment: {
        goals: [
          'Mejorar función motora',
          'Prevenir complicaciones',
          'Optimizar independencia',
          'Educar familia'
        ],
        interventions: [
          'Ejercicios de Bobath',
          'Entrenamiento de marcha',
          'Prevención subluxación hombro',
          'Educación familiar'
        ],
        precautions: [
          'Vigilar signos de deterioro',
          'Prevenir caídas',
          'Monitorear dolor',
          'Evitar fatiga excesiva'
        ],
        followUp: 'Reevaluación semanal'
      },
      expectedOutcomes: [
        'Mejora función motora en 3 meses',
        'Marcha independiente con ayuda',
        'Prevención complicaciones'
      ],
      timeline: '6-12 meses'
    },

    // CASO CRÍTICO - Lesión medular
    {
      id: 'FT-004',
      title: 'Lesión medular T12 completa',
      complexity: 'crítica',
      category: 'neurológica',
      patientInfo: {
        name: 'Laura Fernández',
        age: 24,
        gender: 'femenino',
        occupation: 'Estudiante',
        comorbidities: ['Úlcera por presión', 'Infección urinaria recurrente']
      },
      symptoms: [
        'Paraplejía completa',
        'Alteración función vesical',
        'Alteración función intestinal',
        'Espasticidad severa',
        'Dolor neuropático'
      ],
      clinicalHistory: 'Accidente de tráfico hace 8 meses, lesión medular T12 completa. Múltiples complicaciones.',
      redFlags: [
        'Fiebre sin foco aparente',
        'Deterioro respiratorio',
        'Signos de sepsis',
        'Úlceras por presión grado 3-4'
      ],
      contraindications: [
        'Movilizaciones que comprometan estabilidad',
        'Ejercicios que aumenten presión abdominal',
        'Posiciones que comprometan respiración'
      ],
      assessment: {
        subjective: 'Paciente refiere dolor neuropático en extremidades inferiores, espasticidad severa, dependencia total.',
        objective: 'Paraplejía completa T12, espasticidad severa, úlcera por presión sacra, función respiratoria limitada.',
        tests: [
          { name: 'Escala ASIA', result: 'A', notes: 'Lesión completa' },
          { name: 'Escala de Ashworth', result: 'Grado 4', notes: 'Espasticidad severa' },
          { name: 'Capacidad vital', result: '1.8L', notes: 'Limitación respiratoria' },
          { name: 'Escala de dolor', result: '7/10', notes: 'Dolor neuropático' }
        ]
      },
      treatment: {
        goals: [
          'Prevenir complicaciones',
          'Optimizar función respiratoria',
          'Manejar espasticidad',
          'Mejorar calidad de vida'
        ],
        interventions: [
          'Fisioterapia respiratoria',
          'Manejo de espasticidad',
          'Prevención úlceras',
          'Educación familiar'
        ],
        precautions: [
          'Vigilar función respiratoria',
          'Prevenir úlceras por presión',
          'Manejar espasticidad',
          'Monitorear signos vitales'
        ],
        followUp: 'Reevaluación diaria'
      },
      expectedOutcomes: [
        'Prevención complicaciones',
        'Mejora función respiratoria',
        'Control de espasticidad'
      ],
      timeline: 'Indefinido'
    }
  ];

  const evaluateCase = async (caseData: PhysioCase) => {
    setIsEvaluating(true);
    
    // Simulación de evaluación con IA
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const evaluation: EvaluationMetrics = {
      caseId: caseData.id,
      accuracy: Math.floor(Math.random() * 30) + 70, // 70-100%
      completeness: Math.floor(Math.random() * 25) + 75, // 75-100%
      clinicalReasoning: Math.floor(Math.random() * 35) + 65, // 65-100%
      safetyScore: Math.floor(Math.random() * 20) + 80, // 80-100%
      timeToComplete: Math.floor(Math.random() * 300) + 180, // 3-8 minutos
      suggestions: [
        'Considerar evaluación más detallada de la marcha',
        'Incluir escalas de dolor validadas',
        'Documentar progresión de ejercicios',
        'Evaluar factores psicosociales'
      ],
      overallScore: 0
    };
    
    evaluation.overallScore = Math.round(
      (evaluation.accuracy + evaluation.completeness + evaluation.clinicalReasoning + evaluation.safetyScore) / 4
    );
    
    setEvaluationResults(evaluation);
    setIsEvaluating(false);
    setActiveTab('results');
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'baja': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'crítica': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ortopédica': return '🦴';
      case 'neurológica': return '🧠';
      case 'cardiorrespiratoria': return '🫁';
      case 'deportiva': return '⚽';
      case 'geriátrica': return '👴';
      case 'pediátrica': return '👶';
      default: return '🏥';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Evaluador de Casos de Fisioterapia
          </h1>
          <p className="text-gray-600">
            Sistema de evaluación de casos clínicos de fisioterapia de diferentes complejidades
          </p>
        </div>

        {/* Navegación por Pestañas */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'cases', label: 'Casos Clínicos', icon: '📋' },
              { id: 'evaluation', label: 'Evaluación', icon: '🔍' },
              { id: 'results', label: 'Resultados', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'cases' | 'evaluation' | 'results')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de Pestañas */}
        {activeTab === 'cases' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {physioCases.map((caseData) => (
              <div key={caseData.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {caseData.title}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getComplexityColor(caseData.complexity)}`}>
                        {caseData.complexity.toUpperCase()}
                      </span>
                      <span className="flex items-center space-x-1 text-sm text-gray-600">
                        <span>{getCategoryIcon(caseData.category)}</span>
                        <span>{caseData.category}</span>
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl">{getCategoryIcon(caseData.category)}</span>
                </div>

                <div className="space-y-4">
                  {/* Información del Paciente */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Paciente</h4>
                    <div className="text-sm text-gray-600">
                      <p><strong>Nombre:</strong> {caseData.patientInfo.name}</p>
                      <p><strong>Edad:</strong> {caseData.patientInfo.age} años</p>
                      <p><strong>Ocupación:</strong> {caseData.patientInfo.occupation}</p>
                      <p><strong>Comorbilidades:</strong> {caseData.patientInfo.comorbidities.join(', ')}</p>
                    </div>
                  </div>

                  {/* Síntomas Principales */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Síntomas Principales</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {caseData.symptoms.slice(0, 3).map((symptom, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Banderas Rojas */}
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">🚨 Banderas Rojas</h4>
                    <div className="text-sm text-red-700">
                      {caseData.redFlags.slice(0, 2).map((flag, index) => (
                        <p key={index} className="mb-1">• {flag}</p>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCase(caseData);
                      setActiveTab('evaluation');
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Evaluar Caso
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'evaluation' && selectedCase && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Evaluación: {selectedCase.title}
              </h2>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getComplexityColor(selectedCase.complexity)}`}>
                  {selectedCase.complexity.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600">
                  {getCategoryIcon(selectedCase.category)} {selectedCase.category}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Información Detallada */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Información Clínica</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Historia Clínica</h4>
                      <p className="text-sm text-gray-600">{selectedCase.clinicalHistory}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Síntomas</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedCase.symptoms.map((symptom, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Evaluación</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Subjetivo</h4>
                      <p className="text-sm text-gray-600">{selectedCase.assessment.subjective}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Tests Clínicos</h4>
                      <div className="space-y-2">
                        {selectedCase.assessment.tests.map((test, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{test.name}</span>
                            <span className="text-sm text-gray-600">{test.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tratamiento y Plan */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan de Tratamiento</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Objetivos</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedCase.treatment.goals.map((goal, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Intervenciones</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedCase.treatment.interventions.map((intervention, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                            {intervention}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Precauciones y Contraindicaciones</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">Contraindicaciones</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {selectedCase.contraindications.map((contra, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            {contra}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-900 mb-2">Precauciones</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        {selectedCase.treatment.precautions.map((precaution, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                            {precaution}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => evaluateCase(selectedCase)}
                disabled={isEvaluating}
                className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isEvaluating ? 'Evaluando...' : 'Iniciar Evaluación IA'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'results' && evaluationResults && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Resultados de Evaluación
              </h2>
              <p className="text-gray-600">
                Análisis automatizado del caso clínico
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Métricas de Evaluación */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Calidad</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Precisión Clínica', value: evaluationResults.accuracy, color: 'blue' },
                    { label: 'Completitud', value: evaluationResults.completeness, color: 'green' },
                    { label: 'Razonamiento Clínico', value: evaluationResults.clinicalReasoning, color: 'purple' },
                    { label: 'Seguridad', value: evaluationResults.safetyScore, color: 'red' }
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                        <span className="text-sm font-bold text-gray-900">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-${metric.color}-500`}
                          style={{ width: `${metric.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Puntuación General</span>
                    <span className="text-2xl font-bold text-blue-600">{evaluationResults.overallScore}%</span>
                  </div>
                </div>
              </div>

              {/* Sugerencias y Tiempo */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis y Sugerencias</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tiempo de Evaluación</h4>
                    <p className="text-sm text-gray-600">
                      {Math.floor(evaluationResults.timeToComplete / 60)}m {evaluationResults.timeToComplete % 60}s
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sugerencias de Mejora</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {evaluationResults.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2"></span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">✅ Aspectos Destacados</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Evaluación clínica completa</li>
                      <li>• Identificación correcta de banderas rojas</li>
                      <li>• Plan de tratamiento estructurado</li>
                      <li>• Consideración de precauciones</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => setActiveTab('cases')}
                className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Volver a Casos
              </button>
              <button
                onClick={() => {
                  setEvaluationResults(null);
                  setSelectedCase(null);
                  setActiveTab('cases');
                }}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nueva Evaluación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysiotherapyCaseEvaluator; 