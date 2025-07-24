import React, { useState } from 'react';

interface AnalysisResult {
  phase: string;
  result: {
    error?: string;
    warnings?: string[];
    redFlags?: string[];
    suggestions?: string[];
    soap?: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    };
    [key: string]: unknown;
  };
  timestamp: string;
  processingTime: number;
}

export default function TestFullWorkflowPage() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');

  // Historia desordenada con banderas rojas para fisioterapia
  const testTranscription = `
    Paciente: Buenos días doctor, vengo porque no puedo más con este dolor
    Terapeuta: Cuénteme qué le pasa
    Paciente: Mire, hace como 3 semanas que tengo un dolor en la espalda baja que no me deja ni dormir, es que por las noches es horrible, no encuentro posición cómoda
    Terapeuta: ¿Y durante el día cómo está?
    Paciente: Durante el día también duele pero menos, lo que me preocupa es que también me da como rigidez por las mañanas, como que no puedo moverme bien, dura como una hora hasta que empiezo a sentirme mejor
    Terapeuta: ¿Tiene antecedentes de alguna enfermedad?
    Paciente: Sí, tengo psoriasis desde hace años, me salen placas en los codos y rodillas
    Terapeuta: ¿Algún problema en los ojos?
    Paciente: Ah sí, hace dos años tuve una uveítis, me la trató el oftalmólogo
    Terapeuta: ¿Ha tomado algo para el dolor?
    Paciente: Sí, ibuprofeno y me mejora bastante, pero no quiero estar siempre tomando pastillas
    Terapeuta: ¿Le duele cuando se mueve o cuando está quieto?
    Paciente: Las dos cosas, pero por la noche quieto es cuando peor estoy
    Terapeuta: Voy a explorarle...
  `;

  const runFullWorkflow = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      // FASE 1: Análisis inicial
      setCurrentPhase('Fase 1: Análisis inicial - Detección de banderas rojas');
      const phase1Start = Date.now();
      
      const phase1Response = await fetch('https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/clinicalBrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: testTranscription,
          specialty: 'physiotherapy',
          phase: 'initial_analysis'
        }),
      });
      
      const phase1Result = await phase1Response.json();
      const phase1Time = Date.now() - phase1Start;
      
      setResults(prev => [...prev, {
        phase: 'Fase 1: Análisis Inicial',
        result: phase1Result,
        timestamp: new Date().toISOString(),
        processingTime: phase1Time
      }]);

      // FASE 2: Integración de advertencias y preguntas sugeridas
      setCurrentPhase('Fase 2: Integración de advertencias - Información adicional');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const phase2Start = Date.now();
      const phase2Response = await fetch('https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/clinicalBrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: testTranscription,
          specialty: 'physiotherapy',
          phase: 'integration_analysis',
          previousAnalysis: phase1Result,
          additionalInfo: 'Paciente confirma dolor inflamatorio nocturno, rigidez matutina >1h, antecedente psoriasis cutánea, historia de uveítis anterior'
        }),
      });
      
      const phase2Result = await phase2Response.json();
      const phase2Time = Date.now() - phase2Start;
      
      setResults(prev => [...prev, {
        phase: 'Fase 2: Integración de Advertencias',
        result: phase2Result,
        timestamp: new Date().toISOString(),
        processingTime: phase2Time
      }]);

      // FASE 3: Generación SOAP final
      setCurrentPhase('Fase 3: Generación SOAP final - Estructuración profesional');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const phase3Start = Date.now();
      const phase3Response = await fetch('https://us-east1-aiduxcare-stt-20250706.cloudfunctions.net/clinicalBrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription: testTranscription,
          specialty: 'physiotherapy',
          phase: 'soap_generation',
          previousAnalysis: phase2Result,
          clinicalIntegration: true
        }),
      });
      
      const phase3Result = await phase3Response.json();
      const phase3Time = Date.now() - phase3Start;
      
      setResults(prev => [...prev, {
        phase: 'Fase 3: SOAP Final',
        result: phase3Result,
        timestamp: new Date().toISOString(),
        processingTime: phase3Time
      }]);

      setCurrentPhase('Flujo completo finalizado');
      
    } catch (error) {
      console.error('Error en el flujo completo:', error);
      setResults(prev => [...prev, {
        phase: 'Error',
        result: { error: error instanceof Error ? error.message : 'Error desconocido' },
        timestamp: new Date().toISOString(),
        processingTime: 0
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderResult = (result: AnalysisResult) => (
    <div key={result.timestamp} className="mb-6 p-4 border rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">{result.phase}</h3>
        <span className="text-sm text-gray-600">{result.processingTime}ms</span>
      </div>
      <div className="text-sm text-gray-600 mb-2">
        {new Date(result.timestamp).toLocaleString()}
      </div>
      <pre className="bg-white p-3 rounded border text-sm overflow-x-auto">
        {JSON.stringify(result.result, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            🧠 Test Flujo Completo - 3 Consultas Vertex AI
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Historia Clínica Desordenada (Con Banderas Rojas)</h2>
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <pre className="text-sm whitespace-pre-wrap">{testTranscription}</pre>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <strong>Banderas rojas presentes:</strong> Dolor nocturno, rigidez matutina &gt;1h, antecedente psoriasis + uveítis (sospecha espondiloartropatía)
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={runFullWorkflow}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Ejecutando Flujo...' : 'Ejecutar Flujo Completo (3 Consultas)'}
            </button>
          </div>

          {isLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <span>{currentPhase}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {results.map(renderResult)}
          </div>

          {results.length === 3 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-800 mb-2">✅ Flujo Completo Ejecutado</h3>
              <p className="text-green-700">
                Se han ejecutado las 3 consultas a Vertex AI:
                <br />1. Análisis inicial con detección de banderas rojas
                <br />2. Integración de advertencias y contraindicaciones
                <br />3. Generación del SOAP final estructurado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 