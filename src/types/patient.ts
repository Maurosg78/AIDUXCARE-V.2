/**
 * Interface que define la estructura de datos de un paciente en el sistema.
 * Este modelo es utilizado tanto en el frontend como en el backend para
 * mantener la consistencia de los datos.
 */
export interface Patient {
  /**
   * Identificador único del paciente.
   * Autogenerado por Firestore al crear el documento.
   */
  id: string;

  /**
   * Nombre completo del paciente.
   * @example "Juan Pérez González"
   */
  name: string;

  /**
   * Correo electrónico del paciente.
   * Debe ser un email válido y único en el sistema.
   * @example "juan.perez@email.com"
   */
  email: string;

  /**
   * Número de teléfono del paciente.
   * Formato: +56 9 XXXX XXXX
   * @example "+56 9 1234 5678"
   */
  phone: string;

  /**
   * Fecha de nacimiento del paciente.
   * Almacenada como Date para mantener consistencia.
   */
  birthDate: Date;

  /**
   * Motivo de la consulta del paciente.
   * Descripción detallada del problema o razón por la que
   * el paciente busca atención médica.
   * @example "Dolor de cabeza persistente por 3 días"
   */
  reasonForConsultation: string;

  /**
   * Fecha y hora de creación del registro del paciente.
   * Autogenerado al crear el documento.
   */
  createdAt: Date;

  /**
   * Fecha y hora de la última actualización del registro.
   * Actualizado automáticamente en cada modificación.
   */
  updatedAt: Date;
}

/**
 * Tipo que define los campos requeridos para crear un nuevo paciente.
 * Excluye los campos autogenerados (id, createdAt, updatedAt).
 */
export type CreatePatientDTO = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Tipo que define los campos que pueden ser actualizados de un paciente.
 * Todos los campos son opcionales excepto el id.
 */
export type UpdatePatientDTO = Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>> & {
  id: string;
}; 