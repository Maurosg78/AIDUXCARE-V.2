/**
 * AiDuxCare — ClinicalAuditTrailService
 * Market: CA | Language: en-CA
 * Phase: 3A — Link clinical actions with legal consent log (PHIPA/PIPEDA)
 * WO: WO-2024-002
 */

import { supabase } from "./ConsentAuditService";

export interface AuditEvent {
  id?: string;
  user_id: string;
  note_id?: string;
  event_type: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  description: string;
  timestamp?: string;
  consent_version?: string;
}

export class ClinicalAuditTrailService {
  static async record(event: AuditEvent) {
    const payload = {
      ...event,
      timestamp: new Date().toISOString(),
      consent_version: event.consent_version || "1.1",
    };

    try {
      const { data, error } = await supabase.from("clinical_audit_trail").insert([payload]);
      if (error) throw error;
      console.log("[AuditTrail] recorded:", payload);
      return { data, error: null };
    } catch (err: any) {
      console.error("[AuditTrail] error:", err.message);
      return { data: null, error: err };
    }
  }
}
