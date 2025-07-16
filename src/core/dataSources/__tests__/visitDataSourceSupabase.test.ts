import { describe, it, vi, beforeEach, expect } from 'vitest';
import { VisitDataSourceSupabase } from '../visitDataSourceSupabase';
import { VisitStatus } from '../../domain/visitType';
import supabase from '@/core/auth/supabaseClient';

// Mock de supabase
vi.mock('@/core/auth/supabaseClient', () => ({
  default: {
    from: vi.fn()
  }
}));

describe('VisitDataSourceSupabase', () => {
  let ds: VisitDataSourceSupabase;
  const validVisit = {
    id: '00000000-0000-0000-0000-000000000000',
    professional_id: '00000000-0000-0000-0000-000000000000',
    patient_id: '00000000-0000-0000-0000-000000000000',
    date: '2024-07-15',
    created_at: '2024-07-15T00:00:00Z',
    updated_at: '2024-07-15T00:00:00Z',
    notes: 'test',
    status: VisitStatus.SCHEDULED
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ds = new VisitDataSourceSupabase();
  });

  it('getVisitsByProfessionalId - flujo normal', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [validVisit], error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    const result = await ds.getVisitsByProfessionalId('p1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining(validVisit));
  });

  it('getVisitsByProfessionalId - error de red', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    await expect(ds.getVisitsByProfessionalId('p1')).rejects.toThrow('Error fetching visits: fail');
  });

  it('getVisitById - no encontrado', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    const result = await ds.getVisitById('notfound');
    expect(result).toBeNull();
  });

  it('getVisitById - validación Zod', async () => {
    const invalidVisit = { ...validVisit, date: 123 };
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: invalidVisit, error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    await expect(ds.getVisitById('v1')).rejects.toThrow();
  });

  it('createVisit - flujo normal', async () => {
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: validVisit, error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    const result = await ds.createVisit(validVisit);
    expect(result).toEqual(expect.objectContaining(validVisit));
  });

  it('updateVisit - error de red', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    await expect(ds.updateVisit('v1', {})).rejects.toThrow('Error updating visit: fail');
  });

  it('getVisitsByPatientId - datos vacíos', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    const result = await ds.getVisitsByPatientId('pt1');
    expect(result).toEqual([]);
  });

  it('deleteVisit - éxito', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    const result = await ds.deleteVisit('v1');
    expect(result).toBe(true);
  });

  it('getAllVisits - error de red', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
    };
    vi.mocked(supabase.from).mockReturnValue(mockChain as any);
    
    await expect(ds.getAllVisits()).rejects.toThrow('Error fetching visits: fail');
  });
}); 