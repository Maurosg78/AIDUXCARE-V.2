export interface PatientData {
  id: string;
  nombre: string;
  apellidos: string;
  edad: number;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  historialClinico?: any[];
  ultimaVisita?: string;
  proximaCita?: string;
  notas?: string;
}
