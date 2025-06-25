/**
 * AI: ClinicalInsightsPanel - Visualización de Insights Clínicos IA
 * Panel avanzado para mostrar patrones, alertas y recomendaciones clínicas
 */

import React, { useState } from 'react';
import { 
  ClinicalInsightSummary, 
  ClinicalPattern, 
  ClinicalAlert, 
  ProactiveRecommendation 
} from '@/core/ai/ClinicalInsightsEngine';

interface ClinicalInsightsPanelProps {
  insights?: ClinicalInsightSummary;
  isLoading?: boolean;
  onPatternClick?: (pattern: ClinicalPattern) => void;
  onAlertAction?: (alert: ClinicalAlert, action: string) => void;
  onRecommendationAccept?: (recommendation: ProactiveRecommendation) => void;
  className?: string;
}

// === COMPONENTES AUXILIARES ===

const SeverityBadge: React.FC<{
  severity: 'info' | 'warning' | 'danger' | 'critical';
  text: string;
}> = ({ severity, text }) => {
  const colors = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    danger: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300'
  };

  const icons = {
    info: 'INFO',
    warning: 'WARNING:',
    danger: 'WARNING:',
    critical: 'ALERT'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[severity]}`}>
      {icons[severity]} {text}
    </span>
  );
};

const PriorityBadge: React.FC<{
  priority: 'low' | 'medium' | 'high';
  text: string;
}> = ({ priority, text }) => {
  const colors = {
    low: 'bg-gray-100 text-gray-800 border-gray-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-red-100 text-red-800 border-red-300'
  };

  const icons = {
    low: '🔵',
    medium: 'YELLOW',
    high: 'RED:'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[priority]}`}>
      {icons[priority]} {text}
    </span>
  );
};

const ConfidenceBar: React.FC<{
  confidence: number;
  label: string;
}> = ({ confidence, label }) => {
  const percentage = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? 'bg-green-500' : 
                confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 min-w-0 flex-1">{label}</span>
      <div className="flex items-center gap-1">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${color}`} 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 w-8">{percentage}%</span>
      </div>
    </div>
  );
};

const QualityScore: React.FC<{
  score: number;
  size?: 'small' | 'medium' | 'large';
}> = ({ score, size = 'medium' }) => {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sizes = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-xl',
    large: 'w-20 h-20 text-2xl'
  };

  return (
    <div className={`${sizes[size]} rounded-full border-4 border-gray-200 flex items-center justify-center relative`}>
      <div className={`${sizes[size]} rounded-full border-4 ${getColor(score)} border-current flex items-center justify-center absolute`}
           style={{
             background: `conic-gradient(currentColor ${score * 3.6}deg, transparent 0deg)`
           }}>
        <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-gray-100">
          <span className={`font-bold ${getColor(score)}`}>{score}</span>
        </div>
      </div>
    </div>
  );
};

// === COMPONENTE PRINCIPAL ===

export const ClinicalInsightsPanel: React.FC<ClinicalInsightsPanelProps> = ({
  insights,
  isLoading = false,
  onPatternClick,
  onAlertAction,
  onRecommendationAccept,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'alerts' | 'recommendations'>('overview');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [expandedRec, setExpandedRec] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className={`clinical-insights-panel bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Generando Insights Clínicos...</h3>
              <p className="text-sm text-gray-600">Analizando patrones y evidencia científica</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className={`clinical-insights-panel bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="p-6 text-center">
          <div className="text-gray-400 text-3xl mb-3">AI:</div>
          <h3 className="text-lg font-medium text-gray-700">Insights No Disponibles</h3>
          <p className="text-sm text-gray-500 mt-1">
            Los insights clínicos se generarán automáticamente después del procesamiento
          </p>
        </div>
      </div>
    );
  }

  const totalInsights = insights.patterns.length + insights.alerts.length + insights.recommendations.length;

  return (
    <div className={`clinical-insights-panel bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              AI: Insights Clínicos
            </h3>
            <QualityScore score={insights.overall_assessment.quality_score} size="small" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {insights.processing_metadata.processing_time_ms}ms
            </span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              IA Confianza: {Math.round(insights.processing_metadata.ai_confidence * 100)}%
            </span>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          {totalInsights} insights generados • {insights.processing_metadata.evidence_sources} fuentes científicas
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'overview', label: 'STATS: Resumen', count: totalInsights },
          { key: 'patterns', label: 'SEARCH Patrones', count: insights.patterns.length },
          { key: 'alerts', label: 'WARNING: Alertas', count: insights.alerts.length },
          { key: 'recommendations', label: 'TIP Recomendaciones', count: insights.recommendations.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'overview' | 'patterns' | 'alerts' | 'recommendations')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-purple-500 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Overall Assessment */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-1">Complejidad</div>
                <div className="text-lg font-bold text-blue-600 capitalize">
                  {insights.overall_assessment.clinical_complexity}
                </div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm font-medium text-orange-900 mb-1">Urgencia</div>
                <div className="text-lg font-bold text-orange-600 capitalize">
                  {insights.overall_assessment.intervention_urgency}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-900 mb-1">Pronóstico</div>
                <div className="text-lg font-bold text-green-600 capitalize">
                  {insights.overall_assessment.prognosis_indicator}
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-900 mb-1">Calidad</div>
                <div className="text-lg font-bold text-purple-600">
                  {insights.overall_assessment.quality_score}/100
                </div>
              </div>
            </div>

            {/* AI Confidence Metrics */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Métricas de Confianza IA</h4>
              <div className="space-y-2">
                <ConfidenceBar 
                  confidence={insights.processing_metadata.ai_confidence} 
                  label="Confianza General"
                />
                <ConfidenceBar 
                  confidence={insights.patterns.length > 0 ? 
                    insights.patterns.reduce((sum, p) => sum + p.confidence, 0) / insights.patterns.length : 0} 
                  label="Confianza Patrones"
                />
                <ConfidenceBar 
                  confidence={insights.alerts.length > 0 ? 
                    insights.alerts.filter(a => a.evidence_based).length / insights.alerts.length : 0} 
                  label="Alertas Basadas en Evidencia"
                />
              </div>
            </div>

            {/* Quick Summary */}
            <div className="space-y-3">
              {insights.alerts.filter(a => a.severity === 'critical').length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">ALERT</span>
                    <span className="text-sm font-medium text-red-800">
                      {insights.alerts.filter(a => a.severity === 'critical').length} alertas críticas requieren atención inmediata
                    </span>
                  </div>
                </div>
              )}
              
              {insights.recommendations.filter(r => r.priority === 'high').length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">TIP</span>
                    <span className="text-sm font-medium text-blue-800">
                      {insights.recommendations.filter(r => r.priority === 'high').length} recomendaciones de alta prioridad disponibles
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-3">
            {insights.patterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">SEARCH</div>
                <p>No se detectaron patrones clínicos significativos</p>
              </div>
            ) : (
              insights.patterns.map((pattern) => (
                <div 
                  key={pattern.id}
                  role="button"
                  tabIndex={0}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all"
                  onClick={() => onPatternClick?.(pattern)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPatternClick?.(pattern);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 capitalize">
                          {pattern.type.replace('_', ' ')}
                        </span>
                        <SeverityBadge 
                          severity={pattern.significance === 'critical' ? 'critical' : 'info'} 
                          text={pattern.significance} 
                        />
                      </div>
                      <p className="text-sm text-gray-700">{pattern.pattern}</p>
                    </div>
                    <div className="ml-3 text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round(pattern.confidence * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">confianza</div>
                    </div>
                  </div>
                  
                  {pattern.recommended_actions.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-600 mb-1">Acciones recomendadas:</div>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {pattern.recommended_actions.slice(0, 2).map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {insights.alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">SUCCESS:</div>
                <p>No se detectaron alertas clínicas</p>
              </div>
            ) : (
              insights.alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div 
                    role="button"
                    tabIndex={0}
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedAlert(expandedAlert === alert.id ? null : alert.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>
                          <SeverityBadge severity={alert.severity} text={alert.category} />
                        </div>
                        <p className="text-sm text-gray-700">{alert.description}</p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        {expandedAlert === alert.id ? '▼' : '▶'}
                      </button>
                    </div>
                  </div>
                  
                  {expandedAlert === alert.id && (
                    <div className="px-4 pb-4 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Justificación:</div>
                          <p className="text-xs text-gray-700">{alert.rationale}</p>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-2">Acciones inmediatas:</div>
                          <div className="space-y-1">
                            {alert.immediate_actions.map((action, i) => (
                              <button
                                key={i}
                                onClick={() => onAlertAction?.(alert, action)}
                                className="block w-full text-left text-xs bg-white border border-gray-200 rounded px-2 py-1 hover:bg-blue-50 hover:border-blue-300"
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            {insights.recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">TIP</div>
                <p>No hay recomendaciones disponibles</p>
              </div>
            ) : (
              insights.recommendations.map((rec) => (
                <div 
                  key={rec.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div 
                    role="button"
                    tabIndex={0}
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedRec(expandedRec === rec.id ? null : rec.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedRec(expandedRec === rec.id ? null : rec.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{rec.title}</h4>
                          <PriorityBadge priority={rec.priority} text={rec.type} />
                        </div>
                        <p className="text-sm text-gray-700">{rec.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecommendationAccept?.(rec);
                          }}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                        >
                          Aceptar
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          {expandedRec === rec.id ? '▼' : '▶'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {expandedRec === rec.id && (
                    <div className="px-4 pb-4 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Justificación clínica:</div>
                          <p className="text-xs text-gray-700">{rec.clinical_justification}</p>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Resultados esperados:</div>
                          <ul className="text-xs text-gray-700 list-disc list-inside">
                            {rec.expected_outcomes.map((outcome, i) => (
                              <li key={i}>{outcome}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Pasos de implementación:</div>
                          <ol className="text-xs text-gray-700 list-decimal list-inside">
                            {rec.implementation_steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Powered by AiDuxCare Clinical Intelligence</span>
          <span>Actualizado: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ClinicalInsightsPanel; 