// src/utils/deIdentification.ts
// PIPEDA Compliance — De-Identification Utility
// Market: CA | Language: en-CA | Work Order: WO-2024-002

export interface DeIdentificationConfig {
    removeNames?: boolean;
    removeDates?: boolean;
    removeLocations?: boolean;
    removeIdentifiers?: boolean;
  }
  
  const DEFAULT_CONFIG: DeIdentificationConfig = {
    removeNames: true,
    removeDates: true,
    removeLocations: true,
    removeIdentifiers: true,
  };
  
  export function deIdentifyTranscript(
    text: string,
    config: DeIdentificationConfig = DEFAULT_CONFIG
  ): string {
    let output = text;
  
    if (config.removeNames) {
      output = output.replace(/\b([A-Z][a-z]+)\s([A-Z][a-z]+)\b/g, "[REDACTED_NAME]");
    }
    if (config.removeDates) {
      output = output.replace(/\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\b/g, "[REDACTED_DATE]");
    }
    if (config.removeLocations) {
      output = output.replace(/\b(Toronto|Ottawa|Niagara|Ontario|Canada)\b/gi, "[REDACTED_LOCATION]");
    }
    if (config.removeIdentifiers) {
      output = output.replace(/\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/g, "[REDACTED_ID]");
    }
  
    return output.trim();
  }
  