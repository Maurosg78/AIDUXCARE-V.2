/**
 * AiDuxCare — CryptoService (Phase 1D+2A stable)
 * Market: CA | Language: en-CA
 */

export class CryptoService {
  static async encryptMedicalData(data: any): Promise<string> {
    const encoded = btoa(JSON.stringify(data));
    return encoded;
  }

  static async decryptMedicalData(encoded: string): Promise<any> {
    try {
      return JSON.parse(atob(encoded));
    } catch {
      return null;
    }
  }
}
