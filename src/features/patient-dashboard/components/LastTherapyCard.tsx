import { Encounter } from '../../../repositories/encountersRepo';
import { Timestamp } from 'firebase/firestore';

interface LastTherapyCardProps {
  encounter: Encounter;
  loading?: boolean;
}

export const LastTherapyCard: React.FC<LastTherapyCardProps> = ({ 
  encounter, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="card p-6 rounded-[1rem] shadow-soft">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: Timestamp | Date | string | undefined): string => {
    if (!timestamp) return 'Fecha no disponible';
    
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPainLevelColor = (level: number): string => {
    if (level <= 3) return 'text-green-600';
    if (level <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getToleranceColor = (tolerance: string): string => {
    switch (tolerance) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="card p-6 rounded-[1rem] shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Última terapia aplicada
        </h2>
        <span className="text-sm text-slate-500">
          {formatDate(encounter.encounterDate)}
        </span>
      </div>

      {/* Resumen SOAP */}
      {encounter.soap && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Resumen SOAP:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {encounter.soap.subjective && (
              <div>
                <span className="font-medium text-slate-600">S:</span>
                <p className="text-slate-600 mt-1 line-clamp-2">
                  {encounter.soap.subjective}
                </p>
              </div>
            )}
            
            {encounter.soap.objective && (
              <div>
                <span className="font-medium text-slate-600">O:</span>
                <p className="text-slate-600 mt-1 line-clamp-2">
                  {encounter.soap.objective}
                </p>
              </div>
            )}
            
            {encounter.soap.assessment && (
              <div>
                <span className="font-medium text-slate-600">A:</span>
                <p className="text-slate-600 mt-1 line-clamp-2">
                  {encounter.soap.assessment}
                </p>
              </div>
            )}
            
            {encounter.soap.plan && (
              <div>
                <span className="font-medium text-slate-600">P:</span>
                <p className="text-slate-600 mt-1 line-clamp-2">
                  {encounter.soap.plan}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intervenciones aplicadas */}
      {encounter.interventions && encounter.interventions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Intervenciones aplicadas:</h3>
          <div className="space-y-2">
            {encounter.interventions.map((intervention, index) => (
              <div key={index} className="bg-slate-50 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{intervention.type}</span>
                  {intervention.duration && (
                    <span className="text-xs text-slate-500">{intervention.duration} min</span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{intervention.description}</p>
                {(intervention.sets || intervention.reps) && (
                  <div className="text-xs text-slate-500 mt-1">
                    {intervention.sets && `${intervention.sets} series`}
                    {intervention.sets && intervention.reps && ' • '}
                    {intervention.reps && `${intervention.reps} repeticiones`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Respuesta del paciente */}
      {encounter.patientResponse && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Respuesta del paciente:</h3>
          <div className="flex items-center gap-4">
            {encounter.patientResponse.painLevel !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Dolor:</span>
                <span className={`font-semibold ${getPainLevelColor(encounter.patientResponse.painLevel)}`}>
                  {encounter.patientResponse.painLevel}/10
                </span>
              </div>
            )}
            
            {encounter.patientResponse.tolerance && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Tolerancia:</span>
                <span className={`font-semibold ${getToleranceColor(encounter.patientResponse.tolerance)}`}>
                  {encounter.patientResponse.tolerance}
                </span>
              </div>
            )}
          </div>
          
          {encounter.patientResponse.notes && (
            <p className="text-sm text-slate-600 mt-2">
              {encounter.patientResponse.notes}
            </p>
          )}
        </div>
      )}

      {/* Botón ver completo */}
      <div className="flex justify-end">
        <button className="text-brand-in-600 hover:text-brand-in-600 text-sm font-medium transition-colors">
          Ver completo →
        </button>
      </div>
    </div>
  );
};
