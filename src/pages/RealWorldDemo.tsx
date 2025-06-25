/**
 * 🌍 REAL WORLD DEMO - Demostración Pipeline ChatGPT Real
 * 
 * Demuestra el manejo de transcripciones caóticas reales, no idealizadas.
 * Implementa el enfoque de ChatGPT para audio clínico sin estructura clara.
 * 
 * @author AiDuxCare Team + ChatGPT Real-World Pipeline
 * @date Junio 2025
 * @version 4.0
 */

import React, { useState } from 'react';

// === TRANSCRIPCIONES REALES CAÓTICAS ===

const REAL_WORLD_SAMPLES = [
  {
    id: 'chaos_1',
    title: 'Dolor de Hombro - Narrativa Caótica',
    description: 'Transcripción real sin estructura clara',
    text: 'cuando me siento me paralizo... a veces baja hasta la pierna... no me deja dormir... y el otro día ayudé a mi marido con una caja... eso fue después de lo del bus, creo... me duele aquí cuando levanto así... antes podía hacer ejercicio sin problemas pero ahora...',
    expectedOutput: {
      speaker: 'PATIENT',
      section: 'S',
      entities: ['hombro', 'pierna', 'dolor'],
      assessment: 'Dolor de hombro con irradiación. Historia de trauma.'
    }
  },
  {
    id: 'chaos_2', 
    title: 'Cervicalgia Post-Accidente',
    description: 'Paciente con dolor cervical después de accidente',
    text: 'Hoy me levanté y apenas podía girar el cuello… anoche me dolía hasta el ojo… fue desde el accidente que tuve con el coche… mi trabajo es estar mucho tiempo en la computadora... pero esto es diferente',
    expectedOutput: {
      speaker: 'PATIENT',
      section: 'S', 
      entities: ['cuello', 'ojo', 'dolor', 'accidente'],
      assessment: 'Cefalea cervicogénica post-latigazo cervical'
    }
  },
  {
    id: 'chaos_3',
    title: 'Examen Físico Mezclado',
    description: 'Terapeuta y paciente hablando sin turnos claros',
    text: 'flexione el brazo hacia adelante... sí me duele bastante... observo limitación en 120 grados... cuando hago esto me da como un pellizco... palpo contractura en deltoides... eso es exactamente lo que siento doctor',
    expectedOutput: {
      speaker: 'MIXED',
      section: 'O',
      entities: ['brazo', 'deltoides', 'contractura', 'pellizco'],
      assessment: 'Limitación funcional con contractura muscular'
    }
  },
  {
    id: 'chaos_4',
    title: 'Lumbalgia Compleja',
    description: 'Historia compleja con múltiples factores',
    text: 'desde que empecé en el trabajo nuevo... cargo cajas todo el día... al principio no era nada pero ahora por las mañanas no me puedo ni levantar... mi esposa dice que grito dormido... antes hacía deporte... fútbol los domingos...',
    expectedOutput: {
      speaker: 'PATIENT',
      section: 'S',
      entities: ['espalda', 'lumbar', 'trabajo', 'dolor'],
      assessment: 'Lumbalgia ocupacional con rigidez matinal'
    }
  }
];

// === INTERFACES ===

interface ProcessingResult {
  originalText: string;
  detectedSpeaker: 'PATIENT' | 'THERAPIST' | 'MIXED' | 'AMBIGUOUS';
  speakerConfidence: number;
  soapSection: 'S' | 'O' | 'A' | 'P';
  soapConfidence: number;
  reasoning: string;
  entities: {
    anatomy: string[];
    symptoms: string[];
    temporal: string[];
    severity: string[];
  };
  autoAssessment: string;
  processingTime: number;
}

// === SIMULADOR DEL PIPELINE REAL ===

class RealWorldSimulator {
  
  // Patrones semánticos reales
  private readonly PATIENT_PATTERNS = [
    /me duele|siento|tengo|no puedo/i,
    /cuando (me|estoy|hago)/i,
    /desde (que|hace|el)/i,
    /mi (trabajo|casa|marido|esposa)/i,
    /antes (podía|no|sí)/i,
    /no me deja|me impide|apenas puedo/i
  ];

  private readonly THERAPIST_PATTERNS = [
    /flexione|extienda|gire|observo/i,
    /palpo|examino|evalúo/i,
    /recomiendo|vamos a|el tratamiento/i,
    /mi impresión|considero/i
  ];

  // NER Médico Lite
  private readonly MEDICAL_ENTITIES = {
    anatomy: ['hombro', 'cuello', 'espalda', 'brazo', 'pierna', 'deltoides', 'lumbar', 'cervical'],
    symptoms: ['dolor', 'molestia', 'pellizco', 'contractura', 'limitación', 'rigidez'],
    temporal: ['desde', 'cuando', 'antes', 'ahora', 'anoche', 'mañanas'],
    severity: ['mucho', 'bastante', 'poco', 'apenas', 'exactamente']
  };

  processRealText(text: string): ProcessingResult {
    const startTime = Date.now();
    
    // 1. Inferir hablante por patrones semánticos
    const speakerResult = this.inferSpeaker(text);
    
    // 2. Clasificar SOAP por contexto
    const soapResult = this.classifySOAP(text, speakerResult.speaker);
    
    // 3. Extraer entidades médicas
    const entities = this.extractEntities(text);
    
    // 4. Auto-generar assessment
    const autoAssessment = this.generateAssessment(text, entities);
    
    return {
      originalText: text,
      detectedSpeaker: speakerResult.speaker,
      speakerConfidence: speakerResult.confidence,
      soapSection: soapResult.section,
      soapConfidence: soapResult.confidence,
      reasoning: soapResult.reasoning,
      entities,
      autoAssessment,
      processingTime: Date.now() - startTime
    };
  }

  private inferSpeaker(text: string) {
    const lower = text.toLowerCase();
    let patientScore = 0;
    let therapistScore = 0;

    this.PATIENT_PATTERNS.forEach(pattern => {
      if (pattern.test(lower)) patientScore += 2;
    });

    this.THERAPIST_PATTERNS.forEach(pattern => {
      if (pattern.test(lower)) therapistScore += 2;
    });

    // Detectar mezcla de hablantes
    if (patientScore > 2 && therapistScore > 2) {
      return { speaker: 'MIXED' as const, confidence: 0.8 };
    }

    if (therapistScore > patientScore && therapistScore >= 3) {
      return { speaker: 'THERAPIST' as const, confidence: Math.min(0.95, therapistScore / 10) };
    } else if (patientScore > therapistScore && patientScore >= 3) {
      return { speaker: 'PATIENT' as const, confidence: Math.min(0.95, patientScore / 10) };
    } else {
      return { speaker: 'AMBIGUOUS' as const, confidence: 0.5 };
    }
  }

  private classifySOAP(text: string, speaker: string) {
    const lower = text.toLowerCase();

    if (speaker === 'PATIENT') {
      if (/me duele|siento|tengo|no puedo/i.test(text)) {
        return {
          section: 'S' as const,
          confidence: 0.95,
          reasoning: 'Síntomas subjetivos reportados por paciente'
        };
      }
    }

    if (speaker === 'THERAPIST' || speaker === 'MIXED') {
      if (/observo|palpo|flexione|examino/i.test(text)) {
        return {
          section: 'O' as const,
          confidence: 0.92,
          reasoning: 'Examen físico u observación clínica'
        };
      }
    }

    return {
      section: 'S' as const,
      confidence: 0.7,
      reasoning: 'Clasificación por defecto basada en contexto'
    };
  }

  private extractEntities(text: string) {
    const lower = text.toLowerCase();
    const result = {
      anatomy: [],
      symptoms: [],
      temporal: [],
      severity: []
    };

    Object.keys(this.MEDICAL_ENTITIES).forEach(category => {
      this.MEDICAL_ENTITIES[category].forEach(entity => {
        if (lower.includes(entity)) {
          result[category].push(entity);
        }
      });
    });

    return result;
  }

  private generateAssessment(text: string, entities: any): string {
    const lower = text.toLowerCase();

    if (entities.anatomy.includes('hombro') && entities.symptoms.includes('dolor')) {
      if (lower.includes('pellizco') || lower.includes('limitación')) {
        return 'Limitación funcional de hombro con dolor asociado a movimientos. Compatible con síndrome de pinzamiento subacromial.';
      }
      return 'Dolor de hombro con limitación funcional. Requiere evaluación específica.';
    }

    if (entities.anatomy.includes('cuello') && lower.includes('accidente')) {
      return 'Cervicalgia post-traumática. Compatible con latigazo cervical.';
    }

    if (entities.anatomy.includes('espalda') && entities.temporal.includes('mañanas')) {
      return 'Lumbalgia mecánica con rigidez matinal. Sugiere compromiso facetario.';
    }

    return 'Cuadro musculoesquelético que requiere evaluación específica.';
  }
}

// === COMPONENTE PRINCIPAL ===

const RealWorldDemo: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<typeof REAL_WORLD_SAMPLES[0] | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulator] = useState(new RealWorldSimulator());

  const processSample = async (sample: typeof REAL_WORLD_SAMPLES[0]) => {
    setIsProcessing(true);
    setSelectedSample(sample);
    
    // Simular procesamiento real
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const processedResult = simulator.processRealText(sample.text);
    setResult(processedResult);
    setIsProcessing(false);
  };

  const clearResults = () => {
    setSelectedSample(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🌍 Real World SOAP Pipeline
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Demostración del enfoque ChatGPT para transcripciones caóticas reales
          </p>
          
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">RELOAD: Diferencia Clave</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-red-700 mb-1">ERROR: Enfoque Anterior (Idealizado)</div>
                <div className="italic text-red-600">"TERAPEUTA: ¿Dónde le duele? PACIENTE: En el hombro derecho"</div>
              </div>
              <div>
                <div className="font-medium text-green-700 mb-1">SUCCESS: Enfoque Real (ChatGPT)</div>
                <div className="italic text-green-600">"cuando me siento me paralizo... a veces baja hasta la pierna..."</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PANEL IZQUIERDO - MUESTRAS REALES */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              MIC: Transcripciones Reales Caóticas
            </h2>
            
            <div className="space-y-4">
              {REAL_WORLD_SAMPLES.map((sample) => (
                <div
                  key={sample.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedSample?.id === sample.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => processSample(sample)}
                >
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-800">{sample.title}</h3>
                    <p className="text-sm text-gray-600">{sample.description}</p>
                  </div>
                  
                  <div className="bg-gray-100 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700 italic">
                      "{sample.text.substring(0, 150)}..."
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {sample.expectedOutput.speaker}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      {sample.expectedOutput.section}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      {sample.expectedOutput.entities.length} entidades
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={clearResults}
              className="w-full mt-6 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              TRASH: Limpiar Resultados
            </button>
          </div>

          {/* PANEL DERECHO - RESULTADOS */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              AI: Análisis Pipeline Real
            </h2>

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Procesando con pipeline ChatGPT Real World...</p>
              </div>
            )}

            {!selectedSample && !isProcessing && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">🌍</div>
                <p>Selecciona una transcripción caótica para ver el análisis real</p>
              </div>
            )}

            {result && selectedSample && !isProcessing && (
              <div className="space-y-6">
                
                {/* TEXTO ORIGINAL */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">📝 Transcripción Caótica</h3>
                  <p className="text-sm text-gray-700 italic">"{result.originalText}"</p>
                </div>

                {/* INFERENCIA DE HABLANTE */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">USER: Inferencia de Hablante</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.detectedSpeaker === 'PATIENT' ? 'bg-green-100 text-green-800' :
                        result.detectedSpeaker === 'THERAPIST' ? 'bg-blue-100 text-blue-800' :
                        result.detectedSpeaker === 'MIXED' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.detectedSpeaker === 'PATIENT' ? '🤒 PACIENTE' :
                         result.detectedSpeaker === 'THERAPIST' ? 'DOCTOR: TERAPEUTA' :
                         result.detectedSpeaker === 'MIXED' ? 'RELOAD: MIXTO' : '❓ AMBIGUO'}
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(result.speakerConfidence * 100)}% confianza
                      </span>
                    </div>
                    <div className="text-xs text-blue-700">
                      Inferido por patrones semánticos sin etiquetas explícitas
                    </div>
                  </div>
                </div>

                {/* CLASIFICACIÓN SOAP */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">AI: Clasificación SOAP</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.soapSection === 'S' ? 'bg-yellow-100 text-yellow-800' :
                        result.soapSection === 'O' ? 'bg-green-100 text-green-800' :
                        result.soapSection === 'A' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {result.soapSection} - {
                          result.soapSection === 'S' ? 'SUBJETIVO' :
                          result.soapSection === 'O' ? 'OBJETIVO' :
                          result.soapSection === 'A' ? 'ASSESSMENT' : 'PLAN'
                        }
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(result.soapConfidence * 100)}% confianza
                      </span>
                    </div>
                    <div className="text-xs text-purple-700 bg-white rounded p-2">
                      <strong>Razonamiento:</strong> {result.reasoning}
                    </div>
                  </div>
                </div>

                {/* ENTIDADES MÉDICAS NER LITE */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">🏥 NER Médico Lite</h3>
                  <div className="grid grid-cols-2 gap-3">
                    
                    {result.entities.anatomy.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">🦴 Anatomía</div>
                        <div className="space-y-1">
                          {result.entities.anatomy.map((item, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded mr-1">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.entities.symptoms.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">🤕 Síntomas</div>
                        <div className="space-y-1">
                          {result.entities.symptoms.map((item, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded mr-1">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.entities.temporal.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">⏰ Temporal</div>
                        <div className="space-y-1">
                          {result.entities.temporal.map((item, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mr-1">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.entities.severity.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">STATS: Severidad</div>
                        <div className="space-y-1">
                          {result.entities.severity.map((item, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded mr-1">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* AUTO-ASSESSMENT */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-800 mb-2">TARGET: Assessment Auto-generado</h3>
                  <div className="bg-white rounded p-3">
                    <p className="text-sm text-gray-800">{result.autoAssessment}</p>
                  </div>
                  <div className="text-xs text-indigo-700 mt-2">
                    Generado desde S+O con lógica médica especializada
                  </div>
                </div>

                {/* MÉTRICAS */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">STATS: Métricas de Procesamiento</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tiempo de procesamiento:</span>
                      <span className="font-medium ml-2">{result.processingTime}ms</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Entidades detectadas:</span>
                      <span className="font-medium ml-2">
                        {Object.values(result.entities).flat().length}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* FOOTER CON PIPELINE TÉCNICO */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            🔧 Pipeline Técnico ChatGPT Real World
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">1️⃣ Inferencia de Roles</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Sin etiquetas explícitas</li>
                <li>• Patrones semánticos</li>
                <li>• Scoring por contexto</li>
                <li>• Detección de mezclas</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">2️⃣ Clasificación SOAP</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Heurística semántica</li>
                <li>• Composición sintáctica</li>
                <li>• Contexto clínico</li>
                <li>• Razonamiento explícito</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">3️⃣ NER Médico Lite</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Especializado fisioterapia</li>
                <li>• Extracción simple y efectiva</li>
                <li>• Categorías clínicas</li>
                <li>• Sin LLMs pesados</li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">4️⃣ Auto-Assessment</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Inferencia desde S+O</li>
                <li>• Lógica médica contextual</li>
                <li>• Patrones clínicos</li>
                <li>• Diagnósticos específicos</li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RealWorldDemo; 