// @ts-nocheck
import { useState, useCallback } from 'react';

import PatientService from '../../../services/patientService';

export interface Patient {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  lastVisit?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface UsePatientSearchResult {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  searchPatients: (query: string) => Promise<void>;
}

export const usePatientSearch = (): UsePatientSearchResult => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPatients([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await PatientService.searchPatients(query);
      setPatients(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar pacientes');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    patients,
    loading,
    error,
    searchPatients
  };
};