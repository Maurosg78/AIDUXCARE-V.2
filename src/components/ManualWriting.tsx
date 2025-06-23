/**
 * ✍️ MANUAL WRITING - Modo Redacción Manual
 * 
 * Componente placeholder para el modo de escritura manual con análisis de IA en tiempo real.
 * Permite al profesional escribir libremente mientras la IA analiza y sugiere mejoras.
 */

import React, { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface ManualWritingProps {
  patientName?: string;
  onComplete?: (text: string) => void;
  onBack?: () => void;
}

interface AIAnalysis {
  suggestions: string[];
  warnings: string[];
  missingElements: string[];
  terminology: string[];
}

export default function ManualWriting({ 
  patientName = 'el paciente',
  onComplete,
  onBack 
}: ManualWritingProps) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simular análisis de IA en tiempo real
  useEffect(() => {
    if (text.length > 50) {
      setIsAnalyzing(true);
      
      // Simular delay de análisis
      const timer = setTimeout(() => {
        const mockAnalysis: AIAnalysis = {
          suggestions: [
            'Considera agregar la intensidad del dolor (escala 0-10)',
            'Especifica la duración exacta de los síntomas',
            'Incluye resultados de pruebas específicas si las hay'
          ],
          warnings: [
            'Falta información sobre medicamentos actuales',
            'No se mencionan antecedentes relevantes'
          ],
          missingElements: [
            'Plan de tratamiento específico',
            'Objetivos de rehabilitación',
            'Fecha de seguimiento'
          ],
          terminology: [
            'Dolor lumbar mecánico',
            'Síndrome facetario',
            'Radiculopatía L5'
          ]
        };
        
        setAnalysis(mockAnalysis);
        setIsAnalyzing(false);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setAnalysis(null);
    }
  }, [text]);

  const handleComplete = () => {
    if (onComplete && text.trim()) {
      onComplete(text);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Redacción Manual
        </h1>
        <p className="text-lg text-gray-600">
          Escribe las notas de la consulta con {patientName}
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <PencilIcon className="w-4 h-4 mr-1" />
          Análisis de IA en tiempo real
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Writing Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <PencilIcon className="w-5 h-5 mr-2" />
                Escribe tus notas
              </h3>
              <div className="text-sm text-gray-500">
                {text.length} caracteres
              </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Comienza a escribir las notas de la consulta. La IA analizará tu texto en tiempo real y te proporcionará sugerencias..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Volver al selector
              </button>
              
              <button
                onClick={handleComplete}
                disabled={!text.trim()}
                className={`
                  inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors
                  ${text.trim() 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Continuar con Análisis
              </button>
            </div>
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <LightBulbIcon className="w-5 h-5 mr-2" />
              Análisis de IA
            </h3>

            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Analizando texto...</p>
              </div>
            )}

            {!isAnalyzing && !analysis && text.length < 50 && (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Escribe más de 50 caracteres para ver el análisis
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <LightBulbIcon className="w-4 h-4 mr-1 text-blue-500" />
                      Sugerencias
                    </h4>
                    <ul className="space-y-1">
                      {analysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {analysis.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-yellow-500" />
                      Advertencias
                    </h4>
                    <ul className="space-y-1">
                      {analysis.warnings.map((warning, index) => (
                        <li key={index} className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Elements */}
                {analysis.missingElements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1 text-red-500" />
                      Elementos faltantes
                    </h4>
                    <ul className="space-y-1">
                      {analysis.missingElements.map((element, index) => (
                        <li key={index} className="text-xs text-gray-600 bg-red-50 p-2 rounded">
                          {element}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Terminology */}
                {analysis.terminology.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" />
                      Terminología sugerida
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {analysis.terminology.map((term, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded cursor-pointer hover:bg-green-200"
                          onClick={() => setText(prev => prev + ' ' + term)}
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 