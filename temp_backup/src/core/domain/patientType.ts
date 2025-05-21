import { z } from 'zod';

// Enumeración para género
export enum PatientGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  UNSPECIFIED = 'unspecified'
}

// Esquema de validación para Paciente
export const PatientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  full_name: z.string().optional(),
  age: z.number().optional(),
  gender: z.nativeEnum(PatientGender).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  allergies: z.string().optional(),
  current_medication: z.string().optional(),
  insurance_id: z.string().optional(),
  user_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

// Tipo derivado del esquema
export type Patient = z.infer<typeof PatientSchema>; 