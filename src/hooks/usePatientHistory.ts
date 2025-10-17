/**
 * Hook for fetching and filtering patient clinical notes history
 * Provides loading state, filtering, and error handling with toast notifications
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ClinicalNote } from '@/types/notes';
import { getPatientNotes } from '@/api/__mocks__/notes';
import { useErrorToast } from '@/hooks/useErrorToast';

export interface PatientHistoryFilters {
  status?: 'draft' | 'submitted' | 'signed' | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface UsePatientHistoryResult {
  notes: ClinicalNote[];
  allNotes: ClinicalNote[];
  filters: PatientHistoryFilters;
  setFilters: (filters: PatientHistoryFilters) => void;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const usePatientHistory = (patientId: string): UsePatientHistoryResult => {
  const [allNotes, setAllNotes] = useState<ClinicalNote[]>([]);
  const [filters, setFilters] = useState<PatientHistoryFilters>({ status: 'all' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showApiError, showSuccess } = useErrorToast();

  // Fetch notes from API
  const fetchHistory = useCallback(async () => {
    if (!patientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const notes = await getPatientNotes(patientId);
      // Sort by creation date, most recent first
      const sortedNotes = notes.sort((a, b) => 
        b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()
      );
      setAllNotes(sortedNotes);
      
      if (notes.length === 0) {
        showSuccess('Patient History', 'No previous notes found for this patient');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch patient history');
      setError(error);
      showApiError(error);
      console.error('❌ Failed to fetch patient history:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId, showApiError, showSuccess]);

  // Auto-fetch on mount and patientId change
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Client-side filtering
  const filteredNotes = useMemo(() => {
    return allNotes.filter(note => {
      // Status filter
      if (filters.status && filters.status !== 'all' && note.status !== filters.status) {
        return false;
      }
      
      // Date range filter  
      if (filters.dateFrom && note.createdAt.toDate() < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && note.createdAt.toDate() > filters.dateTo) {
        return false;
      }
      
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = `${note.subjective} ${note.objective} ${note.assessment} ${note.plan}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [allNotes, filters]);

  return {
    notes: filteredNotes,
    allNotes,
    filters,
    setFilters,
    loading,
    error,
    refetch: fetchHistory
  };
};
