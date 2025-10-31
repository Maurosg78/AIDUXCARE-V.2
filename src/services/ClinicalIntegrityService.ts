/**
 * AiDuxCare — ClinicalIntegrityService
 * Market: CA | Language: en-CA
 * Phase: 3B — Hash-based clinical integrity chain (PHIPA/PIPEDA + CPO)
 * WO: WO-2024-002
 */

import crypto from "crypto";
import { ClinicalAuditTrailService } from "./ClinicalAuditTrailService";

export class ClinicalIntegrityService {
  /**
   * Generates a deterministic SHA-256 hash of note data + consent version.
   */
  static generateIntegrityHash(noteData: any, consentVersion = "1.1"): string {
    const serialized = JSON.stringify({
      noteData,
      consentVersion,
    });
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }

  /**
   * Persists the hash as an integrity event in the audit trail.
   */
  static async recordIntegrityEvent(user_id: string, note_id: string, noteData: any, consentVersion?: string) {
    const hash = this.generateIntegrityHash(noteData, consentVersion);
    await ClinicalAuditTrailService.record({
      user_id,
      note_id,
      event_type: "CREATE",
      description: `Integrity hash generated: ${hash.slice(0, 12)}...`,
      consent_version: consentVersion,
    });
    return hash;
  }

  /**
   * Verifies if a hash matches current note data.
   */
  static verifyIntegrity(noteData: any, consentVersion: string, expectedHash: string): boolean {
    const actual = this.generateIntegrityHash(noteData, consentVersion);
    return actual === expectedHash;
  }
}
