import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface VisitRecordCardProps {
  visit: {
    id: string;
    created_at: string;
    reason: string;
  };
  summary?: {
    summary_text: string;
    created_at: string;
  };
  suggestions: Array<{
    content: string;
    field: string;
    accepted_at: string;
  }>;
}

const VisitRecordCard: React.FC<VisitRecordCardProps> = ({ visit, summary, suggestions }) => {
  const navigate = useNavigate();
  const visitDate = new Date(visit.created_at);
  const relativeDate = formatDistanceToNow(visitDate, { addSuffix: true, locale: es });

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      {/* Encabezado de la visita */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {relativeDate}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Motivo: {visit.reason}
          </p>
        </div>
        <button
          onClick={() => navigate(`/visits/${visit.id}`)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Ver visita completa
        </button>
      </div>

      {/* Resumen clínico */}
      {summary ? (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Resumen Clínico
          </h4>
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
            {summary.summary_text}
          </div>
        </div>
      ) : (
        <div className="mb-4 text-sm text-gray-500 italic">
          Sin resumen clínico
        </div>
      )}

      {/* Sugerencias integradas */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Sugerencias IA Integradas
          </h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-green-50 rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-1">
                      {suggestion.field}
                    </span>
                    <p className="text-sm text-gray-600">
                      {suggestion.content}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(suggestion.accepted_at), { 
                      addSuffix: true,
                      locale: es 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitRecordCard; 