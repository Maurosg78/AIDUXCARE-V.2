/* eslint-disable jsx-a11y/label-has-associated-control */
/**
 * 🏥 Physiotherapy Pipeline Test - AiDuxCare V.2
 * Testing del pipeline completo con casos reales
 */

import React, { useState } from 'react';
import PhysiotherapyPipelineService, { 
  ClinicalHighlight, 
  ClinicalWarning, 
  SOAPDocument,
  ProfessionalProfile 
} from '../services/PhysiotherapyPipelineService';

interface TestCase {
  id: string;
  title: string;
  complexity: 'baja' | 'media' | 'alta';
  rawTranscription: string;
  patientInfo: { age: number; gender: string; occupation: string };
  expectedHighlights: number;
  expectedWarnings: number;
}

const PhysiotherapyPipelineTest: React.FC = () => {
  const [selectedCase, setSelectedCase] = useState<TestCase | null>(null);
  const [pipelineResults, setPipelineResults] = useState<{
    highlights: ClinicalHighlight[];
    warnings: ClinicalWarning[];
    complianceIssues: string[];
    suggestedTests: Array<Record<string, unknown>>;
    soapDocument: SOAPDocument | null;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<'transcription' | 'tests' | 'soap'>('transcription');

  // Casos de prueba reales (desordenados como en consulta)
  const testCases: TestCase[] = [
    {
      id: 'CASE-001',
      title: 'Lumbalgia Mecánica - Consulta Real',
      complexity: 'baja',
      rawTranscription: `Paciente: Bueno, doctor, el dolor empezó hace como 3 días... estaba trabajando en la oficina y de repente sentí como un pinchazo en la espalda baja, ¿sabe? Y desde entonces no puedo agacharme bien, me duele mucho cuando me siento por mucho tiempo.

Terapeuta: ¿Y antes de esto, había tenido algún problema similar?

Paciente: Sí, hace como 6 meses tuve algo parecido pero más leve, se me pasó solo con reposo. Pero esta vez es más fuerte, y además... ah sí, también me duele cuando toso o estornudo, ¿eso es normal?

Terapeuta: ¿El dolor se irradia hacia algún lado?

Paciente: Sí, a veces siento como que baja hasta el glúteo derecho, pero no más allá de la rodilla. Y cuando me acuesto boca arriba me duele más, tengo que dormir de lado.

Terapeuta: ¿Ha tomado algún medicamento?

Paciente: Solo paracetamol, pero no me hace mucho efecto. Y bueno, también tengo diabetes tipo 2, pero está controlada con metformina.

Terapeuta: ¿Alguna cirugía previa en la columna?

Paciente: No, nunca me han operado de nada. Pero mi padre tuvo una hernia discal hace años...`,
      patientInfo: { age: 45, gender: 'masculino', occupation: 'Oficinista' },
      expectedHighlights: 8,
      expectedWarnings: 4
    },
    {
      id: 'CASE-002',
      title: 'Hombro Doloroso - Pintora',
      complexity: 'media',
      rawTranscription: `Paciente: Doctora, el hombro derecho me está matando desde hace 6 meses. Al principio era solo cuando pintaba techos, pero ahora me duele hasta para vestirme.

Terapeuta: ¿Cómo describiría el dolor?

Paciente: Es como un dolor sordo, profundo, que empeora cuando levanto el brazo. Y por las noches es horrible, no puedo dormir del lado derecho.

Terapeuta: ¿Ha notado pérdida de fuerza?

Paciente: Sí, antes podía cargar botes de pintura de 5 litros sin problema, ahora me cuesta hasta levantar una taza de café con el brazo derecho.

Terapeuta: ¿Algún traumatismo reciente?

Paciente: No, nada específico. Pero trabajo como pintora desde hace 15 años, siempre movimientos repetitivos arriba de la cabeza.

Terapeuta: ¿Medicamentos actuales?

Paciente: Solo omeprazol para la gastritis, y bueno, tengo hipertensión pero está controlada con enalapril.

Terapeuta: ¿Alergias conocidas?

Paciente: Sí, soy alérgica a los AINEs, me dan urticaria.`,
      patientInfo: { age: 52, gender: 'femenino', occupation: 'Pintora' },
      expectedHighlights: 10,
      expectedWarnings: 6
    },
    {
      id: 'CASE-003',
      title: 'Secuelas ACV - Paciente Geriátrico',
      complexity: 'alta',
      rawTranscription: `Paciente: (habla con dificultad) El... el brazo derecho no... no responde bien desde el accidente.

Terapeuta: ¿Cuándo fue el ACV?

Paciente: Hace... hace 3 meses. Estaba en el baño y de repente... de repente me caí. Mi esposa me encontró y llamó la ambulancia.

Terapeuta: ¿Cómo está la movilidad actualmente?

Paciente: El brazo derecho está... está rígido, no puedo moverlo bien. Y la pierna también, camino con dificultad, me tengo que agarrar de las paredes.

Terapeuta: ¿Ha notado mejoría desde que salió del hospital?

Paciente: Un poco, pero muy lento. Y me duele el hombro derecho, como si estuviera... como si estuviera dislocado.

Terapeuta: ¿Medicamentos actuales?

Paciente: Muchos... warfarina, atorvastatina, metformina, enalapril... y uno para la depresión, sertralina creo.

Terapeuta: ¿Algún problema para tragar?

Paciente: Sí, a veces se me atraganta la comida, especialmente los líquidos.`,
      patientInfo: { age: 68, gender: 'masculino', occupation: 'Jubilado' },
      expectedHighlights: 12,
      expectedWarnings: 8
    }
  ];

  const professionalProfile: ProfessionalProfile = {
    license: 'FT-2025-001',
    country: 'España',
    city: 'Madrid',
    specialties: ['Ortopedia', 'Neurología'],
    certifications: ['Terapia Manual', 'Punción Seca'],
    practiceType: 'clínica'
  };

  const pipelineService = new PhysiotherapyPipelineService(professionalProfile);

  const runPipelineTest = async (testCase: TestCase) => {
    setIsProcessing(true);
    setSelectedCase(testCase);
    setActiveStep('transcription');

    try {
      console.log('🚀 Iniciando pipeline de prueba...');
      
      // FASE 1: Procesamiento de transcripción
      console.log('📋 Fase 1: Procesando transcripción...');
      const transcriptionResults = await pipelineService.processMedicalTranscription(
        testCase.rawTranscription
      );

      setPipelineResults({
        highlights: transcriptionResults.highlights,
        warnings: transcriptionResults.warnings,
        complianceIssues: transcriptionResults.complianceIssues,
        suggestedTests: [],
        soapDocument: null
      });

      // FASE 2: Generación de tests sugeridos
      setActiveStep('tests');
      console.log('🔍 Fase 2: Generando tests sugeridos...');
      const suggestedTests = await pipelineService.generateSuggestedTests(
        transcriptionResults.highlights
      );

      setPipelineResults(prev => prev ? {
        ...prev,
        suggestedTests
      } : null);

      // FASE 3: Generación de SOAP
      setActiveStep('soap');
      console.log('📝 Fase 3: Generando SOAP...');
      const soapDocument = await pipelineService.generateSOAPDocument(
        transcriptionResults.highlights.filter(h => h.isSelected),
        transcriptionResults.warnings.filter(w => w.isAccepted),
        [] // Test results (simulados)
      );

      setPipelineResults(prev => prev ? {
        ...prev,
        soapDocument
      } : null);

      console.log('✅ Pipeline completado exitosamente');
    } catch (error) {
      console.error('❌ Error en pipeline:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleHighlight = (id: string) => {
    if (!pipelineResults) return;
    
    setPipelineResults(prev => prev ? {
      ...prev,
      highlights: prev.highlights.map(h => 
        h.id === id ? { ...h, isSelected: !h.isSelected } : h
      )
    } : null);
  };

  const toggleWarning = (id: string) => {
    if (!pipelineResults) return;
    
    setPipelineResults(prev => prev ? {
      ...prev,
      warnings: prev.warnings.map(w => 
        w.id === id ? { ...w, isAccepted: !w.isAccepted } : w
      )
    } : null);
  };

  const getWarningColor = (type: string) => {
    switch (type) {
      case 'bandera_roja': return 'bg-red-100 text-red-800 border-red-200';
      case 'contraindicación': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'bandera_amarilla': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'punto_ciego': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏥 Pipeline de Fisioterapia - Testing Backend
          </h1>
          <p className="text-gray-600">
            Verificación del pipeline completo con casos reales desordenados
          </p>
        </div>

        {/* Casos de Prueba */}
        {!selectedCase && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {testCases.map((testCase) => (
              <div key={testCase.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {testCase.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      testCase.complexity === 'baja' ? 'bg-green-100 text-green-800' :
                      testCase.complexity === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {testCase.complexity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">
                      {testCase.patientInfo.age} años, {testCase.patientInfo.gender}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-600">
                    <strong>Ocupación:</strong> {testCase.patientInfo.occupation}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Esperados:</strong> {testCase.expectedHighlights} highlights, {testCase.expectedWarnings} warnings
                  </div>
                </div>

                <button
                  onClick={() => runPipelineTest(testCase)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ejecutar Pipeline
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Resultados del Pipeline */}
        {selectedCase && pipelineResults && (
          <div className="space-y-6">
            
            {/* Progreso del Pipeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Pipeline: {selectedCase.title}
                </h2>
                <div className="flex items-center space-x-2">
                  {['transcription', 'tests', 'soap'].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        activeStep === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      {index < 2 && <div className="w-4 h-1 bg-gray-200 mx-2"></div>}
                    </div>
                  ))}
                </div>
              </div>
              
              {isProcessing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Procesando...</p>
                </div>
              )}
            </div>

            {/* FASE 1: Highlights y Warnings */}
            {activeStep === 'transcription' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Highlights */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📋 Highlights Clínicos ({pipelineResults.highlights.length})
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {pipelineResults.highlights.map((highlight) => (
                      <label htmlFor={`highlight-${highlight.id}`} key={highlight.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded border hover:bg-gray-50">
                        <input
                          id={`highlight-${highlight.id}`}
                          type="checkbox"
                          checked={highlight.isSelected}
                          onChange={() => toggleHighlight(highlight.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              highlight.category === 'síntoma' ? 'bg-red-100 text-red-800' :
                              highlight.category === 'hallazgo' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {highlight.category}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(highlight.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{highlight.text}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Warnings */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ⚠️ Advertencias Clínicas ({pipelineResults.warnings.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pipelineResults.warnings.map((warning) => (
                      <div key={warning.id} className={`p-3 rounded border ${getWarningColor(warning.type)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="text-xs font-medium uppercase">
                                {warning.type.replace('_', ' ')}
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                warning.severity === 'alta' ? 'bg-red-200 text-red-800' :
                                warning.severity === 'media' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-green-200 text-green-800'
                              }`}>
                                {warning.severity}
                              </span>
                            </div>
                            <p className="text-sm">{warning.description}</p>
                          </div>
                          <button
                            onClick={() => toggleWarning(warning.id)}
                            className={`ml-2 px-3 py-1 rounded text-xs transition-colors ${
                              warning.isAccepted 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {warning.isAccepted ? '✓ Aceptado' : 'Revisar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FASE 2: Tests Sugeridos */}
            {activeStep === 'tests' && pipelineResults.suggestedTests.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🔍 Tests Clínicos Sugeridos ({pipelineResults.suggestedTests.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pipelineResults.suggestedTests.map((test, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{String(test.name || '')}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          test.category === 'ortopédico' ? 'bg-blue-100 text-blue-800' :
                          test.category === 'neurológico' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {String(test.category || '')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{String(test.description || '')}</p>
                      <div className="text-xs text-gray-500">
                        <strong>Contraindicaciones:</strong> {Array.isArray(test.contraindications) ? test.contraindications.join(', ') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FASE 3: SOAP Document */}
            {activeStep === 'soap' && pipelineResults.soapDocument && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📝 Documento SOAP Generado
                </h3>
                <div className="space-y-4">
                  {Object.entries(pipelineResults.soapDocument).map(([key, value]) => {
                    if (key === 'timestamp' || key === 'version') return null;
                    return (
                      <div key={key}>
                        <h4 className="font-medium text-gray-900 mb-2 uppercase">
                          {key}
                        </h4>
                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compliance Issues */}
            {pipelineResults.complianceIssues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  🚨 Issues de Compliance
                </h3>
                <ul className="space-y-1">
                  {pipelineResults.complianceIssues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-700">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botones de Navegación */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setSelectedCase(null);
                  setPipelineResults(null);
                  setActiveStep('transcription');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Volver a Casos
              </button>
              
              <div className="text-sm text-gray-600">
                Pipeline completado: {activeStep === 'soap' ? '100%' : activeStep === 'tests' ? '66%' : '33%'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhysiotherapyPipelineTest; 