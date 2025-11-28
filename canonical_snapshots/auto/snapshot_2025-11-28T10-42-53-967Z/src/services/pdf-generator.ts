class PDFGenerator {
  static generatePDF(data: any) {
    // Implementación básica para que compile
    console.log('Generando PDF con:', data);
    return new Blob(['PDF temporal'], { type: 'application/pdf' });
  }
}

export default PDFGenerator;
