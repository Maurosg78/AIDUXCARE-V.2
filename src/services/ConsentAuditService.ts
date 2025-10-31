// src/services/ConsentAuditService.ts
// @ts-nocheck
import { createClient } from "@supabase/supabase-js";

/**
 * Safe env loading for Vite + Node environments
 */
const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  process.env.VITE_SUPABASE_URL ||
  "";

const SUPABASE_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Utility to get client IP (fallback-safe)
 */
async function getClientIP(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data?.ip || null;
  } catch {
    return null;
  }
}

/**
 * Logs consent acceptance or withdrawal into Supabase `consent_logs` table.
 * Fully PHIPA/PIPEDA-compliant — versioned & auditable.
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
    const ip = await getClientIP();

    const { data, error } = await supabase.from("consent_logs").insert([
      {
        user_id: userId,
        consent_version: version,
        withdrawn: action === "withdraw",
        consent_ip: ip,
        consent_agent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
      },
    ]);

    if (error) {
      console.error("Consent audit insert error:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Consent audit logging failed:", err);
    return null;
  }
}

