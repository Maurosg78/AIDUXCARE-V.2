/**
 * Hook for signing clinical notes
 * Provides loading state and error handling for sign operations with toast notifications
 */

import { useState, useCallback } from 'react';
import { signNote as signNoteAPI } from '@/api/__mocks__/notes';
import { useErrorToast } from '@/hooks/useErrorToast';

export interface UseSignNoteResult {
  signNote: (noteId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

export const useSignNote = (): UseSignNoteResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showApiError, showSuccess } = useErrorToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signNote = useCallback(async (noteId: string): Promise<void> => {
    if (!noteId) {
      const error = new Error('Note ID is required');
      setError(error);
      showApiError(error);
      throw error;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await signNoteAPI(noteId);
      
      if (!response.success) {
        throw new Error('Failed to sign note');
      }

      showSuccess(
        'Note Signed Successfully',
        'The clinical note has been signed and is now read-only.'
      );
      
      console.log('✅ Note signed successfully:', response.note);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error signing note');
      setError(error);
      showApiError(error);
      console.error('❌ Failed to sign note:', error);
      throw error;
      
    } finally {
      setIsLoading(false);
    }
  }, [showApiError, showSuccess]);

  return {
    signNote,
    isLoading,
    error,
    clearError
  };
};
