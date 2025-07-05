import { vi } from 'vitest';

export type SupabaseResponse<T = unknown> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type SupabaseBuilder = {
  select: (columns?: string) => SupabaseBuilder;
  insert: (data: Record<string, unknown>) => SupabaseBuilder;
  update: (data: Record<string, unknown>) => SupabaseBuilder;
  delete: () => SupabaseBuilder;
  eq: (column: string, value: string | number | boolean) => SupabaseBuilder;
  in: (column: string, values: (string | number | boolean)[]) => SupabaseBuilder;
  gt: (column: string, value: string | number) => SupabaseBuilder;
  lt: (column: string, value: string | number) => SupabaseBuilder;
  or: (conditions: string) => SupabaseBuilder;
  single: () => Promise<SupabaseResponse>;
  then: (callback: (response: SupabaseResponse) => unknown) => Promise<unknown>;
};

export function createSupabaseMock(response: SupabaseResponse): SupabaseBuilder {
  const builder: SupabaseBuilder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    eq: () => builder,
    in: () => builder,
    gt: () => builder,
    lt: () => builder,
    or: () => builder,
    single: () => Promise.resolve(response),
    then: (callback) => Promise.resolve(callback(response))
  };
  return builder;
}

export const mockSupabaseClient = {
  from: vi.fn().mockImplementation(() => createSupabaseMock({ data: null, error: null }))
};

export function setupSupabaseMock() {
  vi.mock('@/core/auth/supabaseClient', () => ({
    default: mockSupabaseClient
  }));
} 