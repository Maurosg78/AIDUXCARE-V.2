
interface SuggestionLog {
  visit_id: string;
  content: string;
  field: string;
  accepted_by: string;
  accepted_at: string;
}

interface VisitIndicatorsProps {
  suggestions: SuggestionLog[];
  visitId: string;
}

const VisitIndicators: React.FC<VisitIndicatorsProps> = ({ suggestions }) => {
  // Calcular total de sugerencias
  const totalSuggestions = suggestions.length;

  // Calcular campos más impactados
  const fieldCounts = suggestions.reduce((acc, suggestion) => {
    acc[suggestion.field] = (acc[suggestion.field] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Obtener los 2 campos más frecuentes
  const topFields = Object.entries(fieldCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([field]) => field);

  // Simular valores de evolución (esto sería reemplazado por datos reales)
  const expectedImprovement = 75;
  const actualImprovement = 60;

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Indicadores de Impacto IA
      </h4>
      
      <div className="space-y-3">
        {/* Total de sugerencias */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {totalSuggestions} sugerencias integradas
          </span>
        </div>

        {/* Campos más impactados */}
        {topFields.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topFields.map(field => (
              <span
                key={field}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {field}: {fieldCounts[field]} sugerencias
              </span>
            ))}
          </div>
        )}

        {/* Barra de progreso de evolución */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Evolución Clínica</span>
            <span>{actualImprovement}% vs {expectedImprovement}% esperado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${actualImprovement}%` }}
            />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-gray-400 h-2 rounded-full"
              style={{ width: `${expectedImprovement}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Real</span>
            <span>Esperado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitIndicators; 