import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { patientsRepo } from '../../../repositories/patientsRepo';
import type { Patient } from '../../../core/types/patient';
import { AsyncState } from '../../command-center/hooks/useUserProfile';

import logger from '@/shared/utils/logger';

export function usePatientCore(patientId: string): AsyncState<Patient> {
  const [state, setState] = useState<AsyncState<Patient>>({
    loading: true
  });

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, error: new Error('Usuario no autenticado') });
        return;
      }

      try {
        const patient = await patientsRepo.getPatientById(patientId);
        
        if (!patient) {
          setState({ loading: false, error: new Error('Paciente no encontrado') });
          return;
        }

        // Verificar que el paciente pertenece al usuario autenticado
        if (patient.ownerUid !== user.uid) {
          setState({ loading: false, error: new Error('Acceso no autorizado') });
          return;
        }

        setState({ loading: false, data: patient });
      } catch (error) {
        console.error('Error obteniendo datos del paciente:', error);
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Error desconocido') 
        });
      }
    });

    return unsubscribe;
  }, [patientId]);

  return state;
}
