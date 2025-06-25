/**
 * 🔬 Evidence Panel - AiDuxCare V.2
 * Panel para mostrar evidencia científica y referencias bibliográficas
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/UI/Button';

interface EvidenceItem {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  url?: string;
  relevanceScore: number;
  abstractSnippet: string;
  category: 'research' | 'guideline' | 'review' | 'case-study';
  evidenceLevel: 'I' | 'II' | 'III' | 'IV' | 'V';
}

interface EvidencePanelProps {
  isLoading?: boolean;
  searchQuery?: string;
  onEvidenceSelect?: (evidence: EvidenceItem) => void;
}

const mockEvidenceData: EvidenceItem[] = [
  {
    id: '1',
    title: 'Effectiveness of Manual Therapy and Exercise for Low Back Pain: A Systematic Review',
    authors: ['Smith, J.A.', 'González, M.R.', 'Johnson, K.L.'],
    journal: 'Journal of Physical Therapy Science',
    year: 2023,
    doi: '10.1589/jpts.35.123',
    url: 'https://example.com/study1',
    relevanceScore: 94,
    abstractSnippet: 'Manual therapy combined with specific exercises shows significant improvement in chronic low back pain patients compared to standard care alone.',
    category: 'research',
    evidenceLevel: 'I'
  },
  {
    id: '2',
    title: 'Clinical Practice Guidelines for Physical Therapy Management of Lumbar Spine Disorders',
    authors: ['American Physical Therapy Association'],
    journal: 'Physical Therapy',
    year: 2024,
    doi: '10.1093/ptj/pzad089',
    relevanceScore: 96,
    abstractSnippet: 'Evidence-based recommendations for assessment and treatment of lumbar spine conditions, including contraindications and safety considerations.',
    category: 'guideline',
    evidenceLevel: 'I'
  },
  {
    id: '3',
    title: 'Contraindications and Precautions in Spinal Manual Therapy: Updated Review',
    authors: ['Rodriguez, C.M.', 'Williams, P.J.'],
    journal: 'Manual Therapy',
    year: 2023,
    doi: '10.1016/j.math.2023.102589',
    relevanceScore: 89,
    abstractSnippet: 'Comprehensive review of absolute and relative contraindications for spinal manipulation, with emphasis on red flags and safety screening.',
    category: 'review',
    evidenceLevel: 'II'
  },
  {
    id: '4',
    title: 'Exercise Therapy vs. Anti-inflammatory Medication in Chronic Low Back Pain',
    authors: ['López, A.B.', 'Chen, L.', 'Miller, R.F.'],
    journal: 'Spine',
    year: 2023,
    doi: '10.1097/BRS.0000000000004567',
    relevanceScore: 87,
    abstractSnippet: 'Randomized controlled trial comparing exercise therapy to NSAIDs in 240 patients with chronic low back pain over 12 weeks.',
    category: 'research',
    evidenceLevel: 'I'
  }
];

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  isLoading = false,
  searchQuery,
  onEvidenceSelect
}) => {
  const [evidenceData, setEvidenceData] = useState<EvidenceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'year' | 'evidence-level'>('relevance');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setEvidenceData(mockEvidenceData);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Filtrar evidencia por categoría
   */
  const filteredEvidence = evidenceData.filter(item => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  /**
   * Ordenar evidencia
   */
  const sortedEvidence = [...filteredEvidence].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        return b.relevanceScore - a.relevanceScore;
      case 'year':
        return b.year - a.year;
      case 'evidence-level':
        return a.evidenceLevel.localeCompare(b.evidenceLevel);
      default:
        return 0;
    }
  });

  /**
   * Toggle expanded item
   */
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  /**
   * Obtener color por categoría
   */
  const getCategoryColor = (category: string) => {
    const colors = {
      research: 'bg-blue-100 text-blue-800',
      guideline: 'bg-green-100 text-green-800',
      review: 'bg-purple-100 text-purple-800',
      'case-study': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  /**
   * Obtener color por nivel de evidencia
   */
  const getEvidenceLevelColor = (level: string) => {
    const colors = {
      I: 'bg-green-500',
      II: 'bg-blue-500',
      III: 'bg-yellow-500',
      IV: 'bg-orange-500',
      V: 'bg-red-500'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Controles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              📚 Evidencia Científica
            </h3>
            <p className="text-sm text-gray-600">
              Referencias bibliográficas relevantes para el caso clínico
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {sortedEvidence.length} referencias encontradas
          </div>
        </div>

        {/* Filtros y Ordenamiento */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label htmlFor="category-select" className="text-sm font-medium text-gray-700">Categoría:</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">Todas</option>
              <option value="research">Investigación</option>
              <option value="guideline">Guías Clínicas</option>
              <option value="review">Revisiones</option>
              <option value="case-study">Casos Clínicos</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Ordenar por:</label>
            <select
              id="sort-select" value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "relevance" | "year" | "evidence-level")}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="relevance">Relevancia</option>
              <option value="year">Año</option>
              <option value="evidence-level">Nivel de Evidencia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Evidencias */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {sortedEvidence.map((evidence) => (
          <div
            key={evidence.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              {/* Header del artículo */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(evidence.category)}`}>
                      {evidence.category === 'research' ? 'Investigación' :
                       evidence.category === 'guideline' ? 'Guía Clínica' :
                       evidence.category === 'review' ? 'Revisión' : 'Caso Clínico'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Nivel</span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getEvidenceLevelColor(evidence.evidenceLevel)}`}
                      >
                        {evidence.evidenceLevel}
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="mr-1">TARGET:</span>
                      {evidence.relevanceScore}%
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-1 leading-tight">
                    {evidence.title}
                  </h4>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">{evidence.authors.join(', ')}</span>
                    <span className="mx-2">•</span>
                    <span className="italic">{evidence.journal}</span>
                    <span className="mx-2">•</span>
                    <span>{evidence.year}</span>
                  </div>
                </div>
              </div>

              {/* Abstract snippet */}
              <div className="text-sm text-gray-700 leading-relaxed">
                {evidence.abstractSnippet}
              </div>

              {/* Expanded content */}
              {expandedItems.has(evidence.id) && (
                <div className="border-t pt-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">DOI:</span>
                      <span className="ml-2 text-blue-600">{evidence.doi || 'No disponible'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Relevancia:</span>
                      <span className="ml-2">{evidence.relevanceScore}% para este caso</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {evidence.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(evidence.url, '_blank')}
                        className="text-xs"
                      >
                        🔗 Ver Artículo Completo
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEvidenceSelect?.(evidence)}
                      className="text-xs"
                    >
                      NOTES: Agregar a SOAP
                    </Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(evidence.id)}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  {expandedItems.has(evidence.id) ? '📄 Menos detalles' : '📄 Más detalles'}
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implementar exportación de cita
                      const citation = `${evidence.authors.join(', ')}. ${evidence.title}. ${evidence.journal}. ${evidence.year}${evidence.doi ? `. doi:${evidence.doi}` : ''}`;
                      navigator.clipboard.writeText(citation);
                      alert('Cita copiada al portapapeles');
                    }}
                    className="text-xs"
                  >
                    📎 Copiar Cita
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer con estadísticas */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {evidenceData.filter(e => e.evidenceLevel === 'I').length}
            </div>
            <div className="text-xs text-gray-600">Nivel I</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {evidenceData.filter(e => e.category === 'guideline').length}
            </div>
            <div className="text-xs text-gray-600">Guías Clínicas</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {Math.round(evidenceData.reduce((acc, e) => acc + e.relevanceScore, 0) / evidenceData.length)}%
            </div>
            <div className="text-xs text-gray-600">Relevancia Promedio</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {new Date().getFullYear() - Math.min(...evidenceData.map(e => e.year))}
            </div>
            <div className="text-xs text-gray-600">Años de Evidencia</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidencePanel; 