/**
 * Tipos para el Wizard de Registro AiDuxCare
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

export type Gender = 'masculino' | 'femenino' | 'otro' | 'prefiero-no-decir';

export type Specialty = 
  | 'fisioterapia'
  | 'medicina'
  | 'psicologia'
  | 'odontologia'
  | 'enfermeria'
  | 'terapia_ocupacional'
  | 'nutricion'
  | 'osteopatia'
  | 'quiropractica'
  | 'medicina_deportiva'
  | 'rehabilitacion'
  | 'geriatria'
  | 'pediatria'
  | 'traumatologia'
  | 'neurologia'
  | 'cardilogia'
  | 'otro';

export type ExperienceLevel = 
  | '0-2'
  | '3-5'
  | '6-10'
  | '11-15'
  | '16-20'
  | '20+';

export interface PersonalData {
  firstName: string;           // Nombre Completo
  secondName?: string;         // Segundo nombre (opcional)
  lastName: string;            // Apellido
  secondLastName?: string;     // Segundo apellido (opcional)
  birthDate: string;           // Fecha de Nacimiento
  email: string;               // Email (con validación de formato)
  phone: string;               // Teléfono Personal
  phoneCountryCode?: string;   // Código de país del teléfono
  gender: Gender | '';         // Género
  password: string;            // Contraseña (con indicador de fortaleza)
  confirmPassword: string;     // Confirmar Contraseña
}

export interface ProfessionalData {
  professionalTitle: string;        // Dr., Dra., FT., Ps., etc.
  specialty: string;               // Especialidad (médicos) o área de expertiz (otros)
  specialtyOther?: string;         // Campo "otro" para especialidad
  university: string;              // Universidad/Institución
  universityOther?: string;        // Campo "otro" para universidad
  licenseNumber: string;           // Número de Licencia/Colegiado
  workplace: string;               // Centro de Trabajo
  experienceYears: string;         // Años de Experiencia
}

export type ProfessionalTitle = 
  | 'Dr.' | 'Dra.' | 'FT.' | 'Ps.' | 'Enf.' | 'Tec.' | 'Lic.' | 'Mag.' | 'Ph.D.' 
  | 'Nat.' | 'Pod.' | 'Nut.' | 'TO.' | 'Log.' | 'Opt.' | 'Bio.' | 'Qui.' | 'Ninguno';

export const professionalTitles: { value: ProfessionalTitle; label: string }[] = [
  { value: 'Dr.', label: 'Dr. - Doctor' },
  { value: 'Dra.', label: 'Dra. - Doctora' },
  { value: 'FT.', label: 'FT. - Fisioterapeuta' },
  { value: 'Ps.', label: 'Ps. - Psicólogo/a' },
  { value: 'Enf.', label: 'Enf. - Enfermero/a' },
  { value: 'Tec.', label: 'Tec. - Técnico' },
  { value: 'Lic.', label: 'Lic. - Licenciado/a' },
  { value: 'Mag.', label: 'Mag. - Magister' },
  { value: 'Ph.D.', label: 'Ph.D. - Doctorado' },
  { value: 'Nat.', label: 'Nat. - Naturópata' },
  { value: 'Pod.', label: 'Pod. - Podólogo/a' },
  { value: 'Nut.', label: 'Nut. - Nutricionista' },
  { value: 'TO.', label: 'TO. - Terapeuta Ocupacional' },
  { value: 'Log.', label: 'Log. - Logopeda' },
  { value: 'Opt.', label: 'Opt. - Óptico/a' },
  { value: 'Bio.', label: 'Bio. - Biólogo/a' },
  { value: 'Qui.', label: 'Qui. - Quiropráctico/a' },
  { value: 'Ninguno', label: 'Ninguno' }
];

export interface LocationData {
  country: string;                     // País
  province: string;                    // Provincia/Estado
  city: string;                        // Ciudad
  consentGDPR: boolean;               // Consentimiento GDPR
  consentHIPAA: boolean;              // Consentimiento HIPAA
}

export interface WizardData {
  personal: PersonalData;
  professional: ProfessionalData;
  location: LocationData;
}

export enum WizardStep {
  PERSONAL_DATA = 1,
  PROFESSIONAL_DATA = 2,
  LOCATION_DATA = 3
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormActions {
  onFieldChange: (field: string, value: string | boolean) => void;
  onValidation: (step: WizardStep) => ValidationResult;
} 