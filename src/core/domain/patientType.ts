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
  id: z.string().min(1, 'ID requerido'), // Firestore ID: cualquier string no vacío
  name: z.string().min(1),
  full_name: z.string().optional(),
  age: z.number().int().min(0).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  allergies: z.string().optional(),
  current_medication: z.string().optional(),
  insurance_id: z.string().optional(),
  user_id: z.string().min(1),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

// Tipo derivado del esquema
export type Patient = z.infer<typeof PatientSchema>; 