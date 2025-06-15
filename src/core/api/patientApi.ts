import { Patient, CreatePatientDTO, UpdatePatientDTO } from '../types/patient';

const API_BASE_URL = 'https://us-central1-aiduxcare-mvp-prod.cloudfunctions.net/api';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export class PatientApiService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Error en la petición', response.status);
    }
    return response.json();
  }

  static async createPatient(patientData: CreatePatientDTO): Promise<Patient> {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    return this.handleResponse<Patient>(response);
  }

  static async getPatient(id: string): Promise<Patient> {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`);
    return this.handleResponse<Patient>(response);
  }

  static async updatePatient(id: string, patientData: UpdatePatientDTO): Promise<Patient> {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    return this.handleResponse<Patient>(response);
  }

  static async deletePatient(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Error al eliminar el paciente', response.status);
    }
  }

  static async getAllPatients(): Promise<Patient[]> {
    const response = await fetch(`${API_BASE_URL}/patients`);
    return this.handleResponse<Patient[]>(response);
  }
} 