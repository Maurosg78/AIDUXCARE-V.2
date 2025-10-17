/**
 * Tests for useSignNote hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSignNote } from '../useSignNote';

// Mock the API
vi.mock('@/api/__mocks__/notes', () => ({
  signNote: vi.fn()
}));

import { signNote as signNoteAPI } from '@/api/__mocks__/notes';

describe('useSignNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useSignNote());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.signNote).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should set loading state during sign operation', async () => {
    vi.mocked(signNoteAPI).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        note: {
          id: 'test-id',
          status: 'signed' as const,
          signedAt: new Date().toISOString(),
          immutable_hash: 'test-hash',
          immutable_signed: true
        }
      }), 100))
    );

    const { result } = renderHook(() => useSignNote());

    act(() => {
      result.current.signNote('test-id');
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should handle successful sign operation', async () => {
    vi.mocked(signNoteAPI).mockResolvedValue({
      success: true,
      note: {
        id: 'test-id',
        status: 'signed' as const,
        signedAt: new Date().toISOString(),
        immutable_hash: 'test-hash',
        immutable_signed: true
      }
    });

    const { result } = renderHook(() => useSignNote());

    await act(async () => {
      await result.current.signNote('test-id');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to sign note';
    vi.mocked(signNoteAPI).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useSignNote());

    await act(async () => {
      try {
        await result.current.signNote('test-id');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('should clear error when clearError is called', async () => {
    vi.mocked(signNoteAPI).mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useSignNote());

    await act(async () => {
      try {
        await result.current.signNote('test-id');
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should throw error if noteId is empty', async () => {
    const { result } = renderHook(() => useSignNote());

    await expect(act(async () => {
      await result.current.signNote('');
    })).rejects.toThrow('Note ID is required');
  });
});
