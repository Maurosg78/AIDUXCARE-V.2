import React from 'react';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface StrictQualityIndicatorProps {
  score: number;
  relativeScore?: number;
  ranking?: string;
  penalties?: any[];
  bonuses?: any[];
  metadata?: any;
}

export const StrictQualityIndicator: React.FC<StrictQualityIndicatorProps> = ({
  score,
  relativeScore,
  ranking,
  penalties = [],
  bonuses = [],
  metadata
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    if (s >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Evaluación de Calidad Estricta
        </h3>
        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}/100
        </div>
      </div>

      {relativeScore !== undefined && (
        <div className="text-sm text-gray-600 mb-2">
          Score relativo: {relativeScore}/100 | {ranking}
        </div>
      )}

      {penalties.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-red-600 mb-1">Penalizaciones:</h4>
          <ul className="text-sm space-y-1">
            {penalties.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-red-500 mt-0.5" />
                <span>{p.reason}: {p.points}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {bonuses.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-green-600 mb-1">Bonificaciones:</h4>
          <ul className="text-sm space-y-1">
            {bonuses.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                <span>{b.reason}: +{b.points}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {metadata && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Metadata del validador
          </summary>
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            {metadata.removedByValidator?.length > 0 && (
              <div>
                <strong>Removidos:</strong> {metadata.removedByValidator.length} items
              </div>
            )}
            {metadata.recategorized?.length > 0 && (
              <div>
                <strong>Recategorizados:</strong> {metadata.recategorized.length} items
              </div>
            )}
            {metadata.addedByValidator?.length > 0 && (
              <div>
                <strong>Agregados:</strong> {metadata.addedByValidator.join(', ')}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};
