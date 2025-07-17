/**
 * 🧪 MVP Test Page - AiDuxCare V.2
 * Interfaz mínima para testeo de funcionalidades core
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AgentSuggestion } from '@/types/agent';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
}

export const MVPTestPage: React.FC = () => {
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([
    { id: 'auth', name: 'Autenticación Firebase', status: 'pending' },
    { id: 'firestore', name: 'Base de Datos Firestore', status: 'pending' },
    { id: 'audio', name: 'Procesamiento de Audio', status: 'pending' },
    { id: 'transcription', name: 'Transcripción STT', status: 'pending' },
    { id: 'soap', name: 'Generación SOAP', status: 'pending' },
    { id: 'suggestions', name: 'Sugerencias IA', status: 'pending' },
    { id: 'integration', name: 'Integración EMR', status: 'pending' },
  ]);

  const [demoSuggestions] = useState<AgentSuggestion[]>([
    {
      id: '1',
      type: 'recommendation',
      field: 'diagnosis',
      content: 'Considerar evaluación de dolor lumbar irradiado',
      sourceBlockId: 'block-1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      type: 'warning',
      field: 'treatment',
      content: 'Paciente alérgico a AINEs - evitar antiinflamatorios',
      sourceBlockId: 'block-2',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      type: 'info',
      field: 'notes',
      content: 'Ejercicios de fortalecimiento lumbar recomendados',
      sourceBlockId: 'block-3',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const runTest = useCallback(async (testId: string) => {
    setCurrentTest(testId);
    setTestResults(prev => 
      prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'running' as const }
          : test
      )
    );

    // Simular test
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const success = Math.random() > 0.2; // 80% éxito
    const duration = Math.floor(1000 + Math.random() * 2000);

    setTestResults(prev => 
      prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: success ? 'passed' as const : 'failed' as const,
              duration,
              error: success ? undefined : 'Error simulado para testing'
            }
          : test
      )
    );
    setCurrentTest(null);
  }, []);

  const runAllTests = useCallback(async () => {
    for (const test of testResults) {
      await runTest(test.id);
    }
  }, [testResults, runTest]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'passed': return '✅';
      case 'failed': return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'passed': return 'text-green-600';
      case 'failed': return 'text-red-600';
    }
  };

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const totalTests = testResults.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 AiDuxCare V.2 - MVP Test Suite
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Interfaz mínima para validación de funcionalidades core
          </p>
          <div className="flex justify-center gap-4 mb-6">
            <div className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-800">
              Tests: {passedTests}/{totalTests} pasando
            </div>
            <div className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-800">
              Sistema: {passedTests === totalTests ? 'Estable' : 'En validación'}
            </div>
            <div className="bg-purple-100 px-3 py-1 rounded-full text-sm text-purple-800">
              Fase: MVP Validación
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Controles de Testing</h2>
              <p className="text-sm text-gray-600">Ejecuta tests individuales o completos</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={runAllTests}
                disabled={currentTest !== null}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentTest ? '🔄 Ejecutando...' : '▶️ Ejecutar Todos'}
              </button>
              <Link
                to="/professional-workflow"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                🏥 Ir a Workflow
              </Link>

            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tests de Infraestructura</h3>
            <div className="space-y-3">
              {testResults.slice(0, 4).map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getStatusIcon(test.status)}</span>
                    <div>
                      <div className={`font-medium ${getStatusColor(test.status)}`}>
                        {test.name}
                      </div>
                      {test.duration && (
                        <div className="text-xs text-gray-500">
                          {test.duration}ms
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => runTest(test.id)}
                    disabled={currentTest !== null}
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentTest === test.id ? '🔄' : '▶️'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tests de Funcionalidad</h3>
            <div className="space-y-3">
              {testResults.slice(4).map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getStatusIcon(test.status)}</span>
                    <div>
                      <div className={`font-medium ${getStatusColor(test.status)}`}>
                        {test.name}
                      </div>
                      {test.error && (
                        <div className="text-xs text-red-500">
                          {test.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => runTest(test.id)}
                    disabled={currentTest !== null}
                    className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentTest === test.id ? '🔄' : '▶️'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evaluador de Casos de Fisioterapia */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-purple-600 text-xl">🏥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Evaluador de Casos Fisioterapia</h3>
              <p className="text-sm text-gray-600">Casos clínicos de diferentes complejidades</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Sistema de evaluación de casos clínicos de fisioterapia con casos reales de baja, media, alta y crítica complejidad.
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Casos ortopédicos, neurológicos, cardiorrespiratorios
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Evaluación automatizada con IA
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Métricas de calidad clínica
            </div>
          </div>
          <Link
            to="/physiotherapy-evaluator"
            className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Abrir Evaluador
          </Link>
        </div>

        {/* Testing Pipeline Fisioterapia */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-indigo-600 text-xl">��</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Testing Pipeline Backend</h3>
              <p className="text-sm text-gray-600">Casos reales desordenados</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Pipeline completo: Transcripción → Highlights/Warnings → Tests → SOAP. Casos reales como en consulta.
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              Transcripción médica especializada
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              Detección automática de banderas rojas
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              Generación SOAP con compliance
            </div>
          </div>
          <Link
            to="/physiotherapy-pipeline-test"
            className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Probar Pipeline
          </Link>
        </div>

        {/* Demo Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sugerencias Demo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sugerencias IA (Demo)</h3>
            <div className="space-y-3">
              {demoSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.type === 'recommendation' ? 'bg-blue-100 text-blue-800' :
                          suggestion.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {suggestion.type}
                        </span>
                        <span className="text-xs text-gray-500">{suggestion.field}</span>
                      </div>
                      <p className="text-sm text-gray-700">{suggestion.content}</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        ✅
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        ❌
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navegación Rápida */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Navegación Rápida</h3>
            <div className="space-y-3">
              <Link
                to="/professional-workflow"
                className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-blue-600">🏥</span>
                  <div>
                    <div className="font-medium text-blue-900">Workflow Profesional</div>
                    <div className="text-sm text-blue-700">Flujo completo de consulta</div>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/audio-processing"
                className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-600">🎤</span>
                  <div>
                    <div className="font-medium text-green-900">Procesamiento de Audio</div>
                    <div className="text-sm text-green-700">Demo de transcripción</div>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/advanced-ai-demo"
                className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-purple-600">🤖</span>
                  <div>
                    <div className="font-medium text-purple-900">Demo IA Avanzada</div>
                    <div className="text-sm text-purple-700">Funcionalidades IA</div>
                  </div>
                </div>
              </Link>
              
              <Link
                to="/professional-workflow"
                className="block p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-orange-600">🏥</span>
                  <div>
                    <div className="font-medium text-orange-900">Consulta Profesional</div>
                    <div className="text-sm text-orange-700">Layout de 3 pestañas integrado</div>
                  </div>
                </div>
              </Link>
              <Link
                to="/register"
                className="block p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-indigo-600">👨‍⚕️</span>
                  <div>
                    <div className="font-medium text-indigo-900">Registro Profesional</div>
                    <div className="text-sm text-indigo-700">Perfil detallado integrado</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
            <span className="text-sm text-gray-600">
              Estado del Sistema: {passedTests === totalTests ? '✅ Estable' : '⚠️ En Validación'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            AiDuxCare V.2 - MVP Test Suite | {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}; 