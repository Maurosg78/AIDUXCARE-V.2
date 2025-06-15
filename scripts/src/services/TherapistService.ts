import { Therapist } from '../types/therapist';

export const getAllTherapists = async (): Promise<Therapist[]> => {
  try {
    const response = await fetch('/api/therapists');
    if (!response.ok) {
      throw new Error('Error al obtener los terapeutas');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en getAllTherapists:', error);
    throw error;
  }
}; 