import PDFGenerator from '../services/pdf-generator';

export const handleDownloadPDF = async (soapNote: any, patient: any, physicalExamResults: any) => {
  try {
    const pdf = await ('generateSOAPReport' in PDFGenerator ? (PDFGenerator as any).generateSOAPReport : async () => new Uint8Array())(
      soapNote,
      patient,
      physicalExamResults
    );
    
    ('download' in PDFGenerator ? (PDFGenerator as any).download : (_p: any, _n: string) => void 0)(pdf, `SOAP_${patient.apellidos}_${patient.nombre}`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Por favor intente nuevamente.');
  }
};
