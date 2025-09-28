// @ts-nocheck
/**
 * Componente de Métricas y Validación
 * Muestra el cumplimiento del schema y métricas de calidad
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, BarChart } from 'lucide-react';

interface ValidationMetricsProps {
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    completenessScore: number;
  };
  metrics: {
    processingTimeSec: string;
    redFlagsDetected: number;
    entitiesExtracted: number;
    testsRecommended: number;
    autoSelectedCount: number;
    estimatedTimeSaved: string;
    costEstimate: string;
  };
}

export const ValidationMetrics: React.FC<ValidationMetricsProps> = ({
  validation,
  metrics
}) => {
  const getCompletionColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getCompletionIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      {/* Header con estado de validación */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getCompletionIcon(validation.completenessScore)}
          <h3 className="font-semibold text-gray-800">
            Validación Clínica
          </h3>
        </div>
        <div className={`text-2xl font-bold ${getCompletionColor(validation.completenessScore)}`}>
          {validation.completenessScore.toFixed(0)}%
        </div>
      </div>
      
      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full transition-all ${
            validation.completenessScore >= 90 ? 'bg-green-500' :
            validation.completenessScore >= 70 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${validation.completenessScore}%` }}
        />
      </div>
      
      {/* Errores y advertencias */}
      {validation.errors.length > 0 && (
        <div className="mb-3 p-2 bg-red-50 rounded">
          <div className="text-sm text-red-800 font-medium mb-1">
            Campos obligatorios faltantes:
          </div>
          {validation.errors.slice(0, 3).map((error, idx) => (
            <div key={idx} className="text-xs text-red-600">
              • {error}
            </div>
          ))}
        </div>
      )}
      
      {validation.warnings.length > 0 && (
        <div className="mb-3 p-2 bg-yellow-50 rounded">
          <div className="text-sm text-yellow-800 font-medium mb-1">
            Recomendaciones:
          </div>
          {validation.warnings.slice(0, 2).map((warning, idx) => (
            <div key={idx} className="text-xs text-yellow-600">
              • {warning}
            </div>
          ))}
        </div>
      )}
      
      {/* Grid de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">Tiempo</div>
          <div className="text-lg font-bold text-gray-800">
            {metrics.processingTimeSec}s
          </div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">Red Flags</div>
          <div className={`text-lg font-bold ${
            metrics.redFlagsDetected > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {metrics.redFlagsDetected}
          </div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">Auto-selección</div>
          <div className="text-lg font-bold text-blue-600">
            {metrics.autoSelectedCount}
          </div>
        </div>
        
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xs text-gray-600">Ahorro</div>
          <div className="text-lg font-bold text-green-600">
            {metrics.estimatedTimeSaved}
          </div>
        </div>
      </div>
      
      {/* Footer con costo */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Costo estimado por nota
        </span>
        <span className="text-sm font-semibold text-gray-800">
          {metrics.costEstimate}
        </span>
      </div>
    </div>
  );
};

export default ValidationMetrics;