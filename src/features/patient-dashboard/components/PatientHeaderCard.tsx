import type { Patient } from '../../../core/types/patient';
import { Episode } from '../../../repositories/episodesRepo';

interface PatientHeaderCardProps {
  patient: Patient;
  episode?: Episode;
  loading?: boolean;
}

export const PatientHeaderCard: React.FC<PatientHeaderCardProps> = ({ 
  patient, 
  episode, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="card p-6 rounded-[1rem] shadow-soft">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-slate-200 rounded w-20"></div>
            <div className="h-6 bg-slate-200 rounded w-24"></div>
            <div className="h-6 bg-slate-200 rounded w-28"></div>
          </div>
        </div>
      </div>
    );
  }

  const calculateAge = (birthDate: Date | undefined): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const birth = patient.birthDate as unknown;
  const birthDateCandidate = typeof birth === 'string' ? new Date(birth) : (birth as Date | { toDate?: () => Date } | undefined);
  const age = birthDateCandidate
    ? calculateAge((birthDateCandidate as { toDate?: () => Date }).toDate ? (birthDateCandidate as { toDate: () => Date }).toDate() : (birthDateCandidate as Date))
    : null;
  const hasAllergies = Array.isArray(patient.clinical?.allergies) && patient.clinical!.allergies!.length > 0;
  const hasPrecautions = Array.isArray(patient.clinical?.precautions) && patient.clinical!.precautions!.length > 0;
  const hasInsurance = undefined;

  return (
    <div className="card p-6 rounded-[1rem] shadow-soft">
      {/* Información principal */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            {patient.firstName} {patient.lastName}
          </h1>
          <div className="flex items-center gap-4 text-slate-600">
            {age && <span>Edad: {age} años</span>}
            {/* ID no garantizado en tipo core Patient */}
            {patient.email && <span>• {patient.email}</span>}
          </div>
        </div>
        
        {/* Estado del episodio */}
        {episode && (
          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-in-100 text-brand-in-700">
              Episodio Activo
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {episode.reason} — Semana {episode.currentWeek}/{episode.totalWeeks}
            </div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {hasAllergies && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ⚠️ Alergias
          </span>
        )}
        
        {hasPrecautions && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⚠️ Precauciones
          </span>
        )}
        
        {hasInsurance && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {/* insurance no disponible en snapshot actual */}
          </span>
        )}
        
        {/* Consentimiento visual desactivado en esta versión IN */}
      </div>

      {/* Motivo de consulta */}
    </div>
  );
};
