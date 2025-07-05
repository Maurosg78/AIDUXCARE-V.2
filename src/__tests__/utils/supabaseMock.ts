import { vi } from "vitest";

export type SupabaseResponse<T = any> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export type SupabaseBuilder = {
  select: (columns?: string) => SupabaseBuilder;
  insert: (data: any) => SupabaseBuilder;
  update: (data: any) => SupabaseBuilder;
  delete: () => SupabaseBuilder;
  eq: (column: string, value: any) => SupabaseBuilder;
  in: (column: string, values: any[]) => SupabaseBuilder;
  gt: (column: string, value: any) => SupabaseBuilder;
  lt: (column: string, value: any) => SupabaseBuilder;
  or: (conditions: string) => SupabaseBuilder;
  single: () => Promise<SupabaseResponse>;
  then: (callback: (response: SupabaseResponse) => any) => Promise<any>;
};

export function createSupabaseMock(
  response: SupabaseResponse,
): SupabaseBuilder {
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
    then: (callback) => Promise.resolve(callback(response)),
  };
  return builder;
}

export const mockSupabaseClient = {
  from: vi
    .fn()
    .mockImplementation(() => createSupabaseMock({ data: null, error: null })),
};

export function setupSupabaseMock() {
  vi.mock("@/core/auth/supabaseClient", () => ({
    default: mockSupabaseClient,
  }));
}
