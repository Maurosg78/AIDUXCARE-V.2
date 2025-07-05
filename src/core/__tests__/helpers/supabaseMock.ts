import { PostgrestQueryBuilder } from "@supabase/postgrest-js";

export const createSupabaseMock = (error?: Error) => {
  const mockBuilder = {
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error }),
      }),
    }),
    insert: () => Promise.reject(error),
    update: () => Promise.reject(error),
    delete: () => Promise.reject(error),
  } as unknown as PostgrestQueryBuilder<any, any, string, unknown>;

  return {
    from: (_relation: string) => mockBuilder,
  };
};
