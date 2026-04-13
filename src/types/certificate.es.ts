export type CertificateTypeEs =
  | 'asistencia-tratamiento'
  | 'estado-clinico-actual'
  | 'derivacion-especialista'
  | 'restricciones-funcionales'
  | 'certificado-escolar'
  | 'otro';

export interface CertificateEsData {
  tipo: CertificateTypeEs;
  institucionDestinataria: string;
  emisor: 'clinica' | 'particular';
  nombreClinica?: string;
  detallesEspecificos: string;
  borrador: string;
  profesional: {
    nombre: string;
    numeroColegiado: string;
    especialidad: string;
  };
  paciente: {
    nombre: string;
    fechaNacimiento: string;
  };
  fechaEmision: string;
}
