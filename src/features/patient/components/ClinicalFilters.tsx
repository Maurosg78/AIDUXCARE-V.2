
export interface ClinicalFilters {
  selectedFields: string[];
  hasSummary: boolean;
  dateRange: {
    from: string;
    to: string;
  };
}

interface ClinicalFiltersProps {
  filters: ClinicalFilters;
  onFiltersChange: (filters: ClinicalFilters) => void;
  totalVisits: number;
  filteredVisits: number;
}

const AVAILABLE_FIELDS = [
  { id: 'anamnesis', label: 'Anamnesis' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'plan', label: 'Plan' },
  { id: 'evolucion', label: 'Evolución' }
];

const ClinicalFilters: React.FC<ClinicalFiltersProps> = ({
  filters,
  onFiltersChange,
  totalVisits,
  filteredVisits
}) => {
  const handleFieldToggle = (fieldId: string) => {
    const newFields = filters.selectedFields.includes(fieldId)
      ? filters.selectedFields.filter(f => f !== fieldId)
      : [...filters.selectedFields, fieldId];
    
    onFiltersChange({
      ...filters,
      selectedFields: newFields
    });
  };

  const handleSummaryToggle = () => {
    onFiltersChange({
      ...filters,
      hasSummary: !filters.hasSummary
    });
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Filtros Clínicos
        </h3>
        <span className="text-sm text-gray-600">
          Mostrando {filteredVisits} de {totalVisits} visitas
        </span>
      </div>

      <div className="space-y-4">
        {/* Campos clínicos */}
        <div>
          <label htmlFor="fields-ia" className="block text-sm font-medium text-gray-700 mb-2">
            Campos Impactados por IA
          </label>
          <div className="flex flex-wrap gap-2" id="fields-ia">
            {AVAILABLE_FIELDS.map(field => (
              <button
                key={field.id}
                onClick={() => handleFieldToggle(field.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                  ${filters.selectedFields.includes(field.id)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {field.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen IA */}
        <div className="flex items-center">
          <label htmlFor="hasSummary" className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="hasSummary"
              checked={filters.hasSummary}
              onChange={handleSummaryToggle}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700">
              Solo visitas con resumen clínico generado
            </span>
          </label>
        </div>

        {/* Rango de fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              id="dateFrom"
              value={filters.dateRange.from}
              onChange={(e) => handleDateChange('from', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              id="dateTo"
              value={filters.dateRange.to}
              onChange={(e) => handleDateChange('to', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalFilters; 