/**
 * Tests for usePatientHistory hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import { usePatientHistory } from '../usePatientHistory';

// Mock the API
jest.mock('@/api/__mocks__/notes', () => ({
  getPatientNotes: jest.fn()
}));

describe('usePatientHistory', () => {
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => usePatientHistory('patient-1'));
    
    expect(result.current.notes).toEqual([]);
    expect(result.current.allNotes).toEqual([]);
    expect(result.current.filters).toEqual({ status: 'all' });
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should handle empty patient ID', () => {
    const { result } = renderHook(() => usePatientHistory(''));
    
    expect(result.current.loading).toBe(false);
  });
});
