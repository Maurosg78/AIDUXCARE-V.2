/**
 * 🔬 EvidencePanel - Mostrar Evidencia Científica RAG
 * Componente para visualizar artículos científicos y evidencia
 */

import React, { useState } from 'react';
import { RAGQueryResult, CitationReference } from '@/core/mcp/RAGMedicalMCP';

interface EvidencePanelProps {
  ragResult?: RAGQueryResult;
  isLoading?: boolean;
  onArticleClick?: (citation: CitationReference) => void;
  onRefresh?: () => void;
  className?: string;
}

interface EvidenceBadgeProps {
  level: string;
  articles: number;
  confidence: number;
}

const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ level, articles, confidence }) => {
  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'Level-1': return 'bg-green-100 text-green-800 border-green-300';
      case 'Level-2': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Guidelines': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Consensus': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(level)}`}>
      🔬 {level} • {articles} estudios • {confidence}%
    </span>
  );
};

const ArticlePreview: React.FC<{
  citation: CitationReference;
  onClick?: () => void;
}> = ({ citation, onClick }) => {
  return (
    <div 
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
            {citation.title}
          </h4>
          <p className="text-xs text-gray-600 mb-2">
            {citation.authors} • {citation.journal} ({citation.year})
          </p>
          <div className="flex items-center gap-2">
            <EvidenceBadge 
              level="Level-1" 
              articles={1} 
              confidence={Math.round(citation.relevance_score * 100)}
            />
            {citation.pmid && (
              <span className="text-xs text-blue-600">PMID: {citation.pmid}</span>
            )}
          </div>
        </div>
        <div className="ml-2 text-right">
          <div className="text-lg font-bold text-blue-600">
            {Math.round(citation.relevance_score * 100)}%
          </div>
          <div className="text-xs text-gray-500">relevancia</div>
        </div>
      </div>
    </div>
  );
};

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  ragResult,
  isLoading = false,
  onArticleClick,
  onRefresh,
  className = ''
}) => {
  const [expandedSection, setExpandedSection] = useState<'summary' | 'articles' | 'context'>('summary');

  if (isLoading) {
    return (
      <div className={`evidence-panel ${className}`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Buscando evidencia científica...</h3>
              <p className="text-xs text-blue-700">Consultando PubMed</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ragResult || ragResult.citations.length === 0) {
    return (
      <div className={`evidence-panel ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <div className="text-gray-400 text-2xl mb-2">🔍</div>
            <h3 className="text-sm font-medium text-gray-700">Sin evidencia disponible</h3>
            <p className="text-xs text-gray-500 mt-1">
              No se encontraron artículos científicos relevantes
            </p>
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                🔄 Intentar nueva búsqueda
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`evidence-panel bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🔬 Evidencia Científica
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {ragResult.processing_time_ms}ms
            </span>
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="text-gray-400 hover:text-gray-600 text-sm"
                title="Actualizar evidencia"
              >
                🔄
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Query: "{ragResult.query}"
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'summary', label: '📊 Resumen', count: ragResult.citations.length },
          { key: 'articles', label: '📚 Artículos', count: ragResult.citations.length },
          { key: 'context', label: '🧠 Contexto', count: 1 }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setExpandedSection(tab.key as 'summary' | 'articles' | 'context')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              expandedSection === tab.key
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        
        {/* Summary Tab */}
        {expandedSection === 'summary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {ragResult.citations.length}
                </div>
                <div className="text-xs text-green-700">Artículos encontrados</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(ragResult.confidence_score * 100)}%
                </div>
                <div className="text-xs text-blue-700">Confianza general</div>
              </div>
            </div>
            
            {/* Top Article Preview */}
            {ragResult.citations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">📈 Artículo más relevante:</h4>
                <ArticlePreview 
                  citation={ragResult.citations[0]}
                  onClick={() => onArticleClick?.(ragResult.citations[0])}
                />
              </div>
            )}
          </div>
        )}

        {/* Articles Tab */}
        {expandedSection === 'articles' && (
          <div className="space-y-3">
            {ragResult.citations.map((citation, index) => (
              <ArticlePreview
                key={`${citation.pmid}-${index}`}
                citation={citation}
                onClick={() => onArticleClick?.(citation)}
              />
            ))}
          </div>
        )}

        {/* Context Tab */}
        {expandedSection === 'context' && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 mb-2">🧠 Contexto médico generado:</h4>
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 leading-relaxed">
              {ragResult.medical_context || 'No hay contexto médico disponible.'}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Fuente: PubMed • Actualizado en tiempo real</span>
          <span>Costo: $0.00</span>
        </div>
      </div>
    </div>
  );
};

export default EvidencePanel; 