import { SOAPGenerator } from '../services/soap-generator';

export const handleGenerateSOAP = async (
  niagaraResults: any,
  physicalExamResults: any,
  selectedPatient: any,
  selectedFindings: string[],
  generateSOAPNote: any
) => {
  try {
    // Generar SOAP local inmediatamente
    const soapData = SOAPGenerator.generateFromData(
      niagaraResults?.entities || [],
      physicalExamResults,
      selectedPatient
    );
    
    // También intentar enriquecer con Vertex
    generateSOAPNote(selectedFindings, physicalExamResults);
    
    return soapData;
  } catch (error) {
    console.error('Error generating clinical note:', error);
    return null;
  }
};
