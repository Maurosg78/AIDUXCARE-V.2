import PDFGenerator from '../services/pdf-generator';

export const handleDownloadPDF = async (soapNote: any, patient: any, physicalExamResults: any) => {
  try {
    const pdf = await PDFGenerator.generateSOAPReport(
      soapNote,
      patient,
      physicalExamResults
    );
    
    PDFGenerator.download(pdf, `SOAP_${patient.apellidos}_${patient.nombre}`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Por favor intente nuevamente.');
  }
};
