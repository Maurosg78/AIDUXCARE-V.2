import { vi } from "vitest";

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: () => ({
      from: () => ({
        insert: async (payload: any) => {
          console.log("[MOCK_SUPABASE] insert:", payload);
          return { data: payload, error: null };
        },
      }),
    }),
  };
});
