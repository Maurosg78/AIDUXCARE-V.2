import { vi } from "vitest";
import { vi } from 'vitest';

// Mock completo del cliente Supabase para tests
export const supabaseClientMock = {
  // Auth methods
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockImplementation((callback) => {
      // Devuelve una función para desuscribirse
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  
  // Database methods
  from: vi.fn().mockImplementation((table) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    overlap: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: {}, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
  
  // Storage methods
  storage: {
    from: vi.fn().mockImplementation((bucket) => ({
      upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
      download: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.png' } }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  },
  
  // RPC calls
  rpc: vi.fn().mockResolvedValue({ data: {}, error: null }),
};
