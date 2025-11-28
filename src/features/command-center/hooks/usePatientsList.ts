import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { patientsRepo, PatientWithId } from '../../../repositories/patientsRepo';

export interface PatientListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface UsePatientsListResult {
  patients: PatientListItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook para obtener lista de pacientes ordenados alfabéticamente por apellido
 */
export function usePatientsList(): UsePatientsListResult {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPatients = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener pacientes del fisio
      const patientsData = await patientsRepo.getPatientsByOwner(user.uid, 'active');

      // Convertir y ordenar por apellido alfabéticamente
      const patientsList: PatientListItem[] = patientsData
        .map((patient) => {
          // La estructura de Patient viene de core/types/patient.ts
          // Tiene firstName, lastName directamente en PatientCore
          const firstName = patient.firstName || '';
          const lastName = patient.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Patient';
          
          return {
            id: patient.id,
            firstName: firstName,
            lastName: lastName,
            fullName: fullName,
            email: patient.email || undefined,
            phone: patient.phone || undefined,
          };
        })
        .sort((a, b) => {
          // Ordenar por apellido, luego por nombre
          const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '', 'en', { sensitivity: 'base' });
          if (lastNameCompare !== 0) return lastNameCompare;
          return (a.firstName || '').localeCompare(b.firstName || '', 'en', { sensitivity: 'base' });
        });

      setPatients(patientsList);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError(err instanceof Error ? err : new Error('Failed to load patients'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [user?.uid]);

  return {
    patients,
    loading,
    error,
    refresh: loadPatients,
  };
}

