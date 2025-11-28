import { useState, useCallback } from 'react';

import { appointmentService } from '../../../services/appointmentService';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  dateTime: string;
  duration: number; // en minutos
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseAppointmentScheduleResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  getAppointments: (date: Date) => Promise<void>;
}

export const useAppointmentSchedule = (): UseAppointmentScheduleResult => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAppointments = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const results = await appointmentService.getAppointments({
        start: startOfDay,
        end: endOfDay
      });
      
      setAppointments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar citas');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    appointments,
    loading,
    error,
    getAppointments
  };
};
