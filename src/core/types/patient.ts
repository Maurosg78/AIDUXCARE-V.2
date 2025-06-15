export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  reasonForConsultation: string;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

export type CreatePatientDTO = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientDTO = Partial<CreatePatientDTO>; 