import { safeLogger } from '../utils/safeLogger';

class PDFGenerator {
  static generatePDF(data: any) {
    // Implementación básica para que compile
    const pdfDataKeys = data && typeof data === 'object' ? Object.keys(data) : [];
    safeLogger.clinicalContextBuilt(pdfDataKeys, 'pdf_generation_requested');
    return new Blob(['PDF temporal'], { type: 'application/pdf' });
  }
}

export default PDFGenerator;
