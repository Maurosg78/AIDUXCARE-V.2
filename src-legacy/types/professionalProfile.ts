export interface ProfessionalProfile {
  id?: string;
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
  };
  professionalInfo: {
    profession: string;
    specialization?: string;
    licenseNumber: string;
    country: string;
    yearsOfExperience?: number;
    institution?: string;
  };
  complianceInfo: {
    gdprConsent: boolean;
    dataProcessingConsent: boolean;
    mfaEnabled?: boolean;
    hipaaConsent?: boolean;
    latamConsent?: boolean;
    canadaConsent?: boolean;
    pipedaConsent?: boolean;
  };
  timestamps: {
    createdAt: Date;
    updatedAt: Date;
    emailVerifiedAt?: Date;
  };
  status: {
    isActive: boolean;
    isEmailVerified: boolean;
    isProfileComplete: boolean;
  };
} 