/**
 * AiDuxCare — Consent Audit Service
 * Work Order: WO-2024-002
 * Market: CA | Language: en-CA
 * Purpose: Log consent acceptance / withdrawal into Supabase (PHIPA/PIPEDA compliance)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// ✅ Ensure environment variables load for Vitest or Node
dotenv.config({ path: ".env.test.local" });

// ✅ Use process.env only — compatible with Node, Vitest, and Vite builds
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

// Warn if missing (only once)
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("[ConsentAuditService] ⚠️ Missing Supabase env vars, running in mock mode.");
}

// 🧩 Create Supabase client or mock
export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : {
      from: () => ({
        insert: async (payload: any) => {
          console.log("[ConsentAuditService:MOCK] would insert:", payload);
          return { data: payload, error: null };
        },
      }),
    } as any;

/**
 * Logs consent acceptance or withdrawal into Supabase `consent_logs` table.
 */
export async function logConsentAction({
  userId,
  action = "accept",
  version = "1.1",
}: {
  userId: string;
  action?: "accept" | "withdraw";
  version?: string;
}) {
  try {
    const consentAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : "node-test";
    const consentIp =
      (typeof window !== "undefined" && (window as any).clientInformation?.ip) ||
      "127.0.0.1";

    const { data, error } = await supabase.from("consent_logs").insert([
      {
        user_id: userId,
        consent_version: version,
        withdrawn: action === "withdraw",
        consent_ip: consentIp,
        consent_agent: consentAgent,
      },
    ]);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[ConsentAuditService] ❌ Audit insert failed:", err);
    return null;
  }
}
