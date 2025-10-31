/**
 * AiDuxCare — AuditDashboardService
 * Phase: 7C (Unified Audit Dashboard)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Aggregate every audit artifact (proof → report → regulator → insurance)
 *   into one unified JSON dashboard for CTO + regulator oversight.
 */

import fs from "fs";
import path from "path";

export interface UnifiedAuditEntry {
  note_id: string;
  proof?: any;
  compliance_report?: any;
  audit_pdf?: string;
  regulator_validation?: any;
  insurance_record?: any;
  timestamp: string;
}

export class AuditDashboardService {
  private static outputDir = path.join(process.cwd(), "output");
  private static dashboardPath = path.join(this.outputDir, "audit_dashboard.json");

  /** Build unified audit dashboard */
  static buildDashboard(): UnifiedAuditEntry[] {
    const entries: UnifiedAuditEntry[] = [];

    // Load optional sources if exist
    const proofs = this.safeLoad("proof_note-");
    const validations = this.safeRead("external_validation_ledger.json");
    const insurance = this.safeRead("insurance_audit_log.json");

    // Collect all note_ids
    const noteIds = new Set<string>();
    proofs.forEach((p: any) => noteIds.add(p.note_id));
    validations.forEach((v: any) => noteIds.add(v.note_id));
    insurance.forEach((i: any) => noteIds.add(i.payload?.id || i.note_id));

    for (const note_id of noteIds) {
      const proof = proofs.find((p: any) => p.note_id === note_id);
      const validation = validations.find((v: any) => v.note_id === note_id);
      const insuranceRec = insurance.find((i: any) =>
        i.payload?.id?.includes(note_id.slice(-4))
      );
      const reportJson = path.join(this.outputDir, `compliance_report_${note_id}.json`);
      const auditPdf = path.join(this.outputDir, `compliance_report_${note_id}_audit_signed.pdf`);

      const entry: UnifiedAuditEntry = {
        note_id,
        proof,
        compliance_report: fs.existsSync(reportJson)
          ? JSON.parse(fs.readFileSync(reportJson, "utf8"))
          : null,
        audit_pdf: fs.existsSync(auditPdf) ? auditPdf : undefined,
        regulator_validation: validation,
        insurance_record: insuranceRec,
        timestamp: new Date().toISOString(),
      };
      entries.push(entry);
    }

    fs.writeFileSync(this.dashboardPath, JSON.stringify(entries, null, 2));
    console.log("[AuditDashboard] built:", { count: entries.length });
    return entries;
  }

  /** Helper — load all proof JSON files */
  private static safeLoad(prefix: string) {
    const files = fs.readdirSync(this.outputDir).filter((f) => f.startsWith(prefix) && f.endsWith(".json"));
    return files.map((f) => JSON.parse(fs.readFileSync(path.join(this.outputDir, f), "utf8")));
  }

  /** Helper — read JSON file safely */
  private static safeRead(name: string): any[] {
    const full = path.join(this.outputDir, name);
    return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, "utf8")) : [];
  }
}
