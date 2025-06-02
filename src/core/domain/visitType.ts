import { z } from 'zod';

// Enumeración para estado de visitas
export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Esquema de validación para Visita
export const VisitSchema = z.object({
  id: z.string().uuid(),
  professional_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  date: z.string(),
  status: z.nativeEnum(VisitStatus),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

// Tipo derivado del esquema
export type Visit = z.infer<typeof VisitSchema>;

export interface CreateVisitDTO {
  patient_id: string;
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface UpdateVisitDTO {
  date?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
} 