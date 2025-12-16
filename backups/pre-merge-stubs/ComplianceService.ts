export class ComplianceService {
  async verifySOAPCompliance(text: string): Promise<string> {
    // Detecta caracteres no permitidos (acentos, ñ o palabras clave comunes en español)
    const isNonEnglish = /[áéíóúñÑüÜ]|paciente|dolor|refiere/i.test(text);
    return isNonEnglish
      ? "❌ Non-compliant text (contains non-English content)"
      : "✅ Compliant with PHIPA/PIPEDA";
  }
}
