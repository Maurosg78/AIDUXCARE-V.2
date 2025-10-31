/**
 * AiDuxCare — ExternalRegulatorValidationService
 * Phase: 7A (External Regulator Validation)
 * Market: CA | Language: en-CA
 * WO: WO-2024-002
 *
 * Purpose:
 *   Simulate external regulator verification of exported bundles.
 *   - Validate manifest hashes
 *   - Confirm ledger match
 *   - Record outcome in a secondary validation ledger
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PublicVerifierService } from "./PublicVerifierService";

export interface ValidationRecord {
  id: string;
  note_id: string;
  bundle_hash: string;
  verified: boolean;
  timestamp: string;
  regulator: string;
}

export class ExternalRegulatorValidationService {
  private static validationLedger = path.join(process.cwd(), "output", "external_validation_ledger.json");

  /** Compute SHA-256 of a file */
  static sha256(filePath: string): string {
    const data = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /** Validate all manifest hashes */
  static validateManifest(manifestPath: string): boolean {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return manifest.every((entry: any) => {
      const computed = this.sha256(path.join(path.dirname(manifestPath), entry.file));
      return computed === entry.hash;
    });
  }

  /** Simulate regulator validation and ledger record */
  static validateBundle(noteId: string, regulator = "CPO Ontario"): ValidationRecord {
    const outputDir = path.join(process.cwd(), "output");
    const bundlePath = path.join(outputDir, `regulator_bundle_${noteId}.zip`);
    const manifestPath = path.join(outputDir, `manifest_${noteId}.json`);

    if (!fs.existsSync(bundlePath) || !fs.existsSync(manifestPath))
      throw new Error("Required files missing for validation.");

    const bundleHash = this.sha256(bundlePath);
    const manifestOK = this.validateManifest(manifestPath);
    const ledgerOK = PublicVerifierService.verifyBundle(bundlePath);
    const verified = manifestOK && ledgerOK;

    const record: ValidationRecord = {
      id: crypto.randomUUID(),
      note_id: noteId,
      bundle_hash: bundleHash,
      verified,
      timestamp: new Date().toISOString(),
      regulator,
    };

    const ledger = fs.existsSync(this.validationLedger)
      ? JSON.parse(fs.readFileSync(this.validationLedger, "utf8"))
      : [];
    ledger.push(record);
    fs.writeFileSync(this.validationLedger, JSON.stringify(ledger, null, 2));

    console.log("[ExternalValidation] recorded:", record);
    return record;
  }
}
