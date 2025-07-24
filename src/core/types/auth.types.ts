/**
 * 🔐 **Enterprise Authentication Types**
 * 
 * Tipos centrales para autenticación enterprise con:
 * - Zero uso de `any`
 * - Escalabilidad para MFA futuro
 * - Compliance HIPAA/GDPR ready
 */

// =====================================================
// USER IDENTITY & AUTHENTICATION
// =====================================================

export interface UserIdentity {
  readonly id: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly createdAt: Date;
  readonly lastLoginAt: Date | null;
}

export interface UserProfile {
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly organization: string;
  readonly role: ProfessionalRole;
  readonly specialization: string;
  readonly licenseNumber: string;
  readonly country: string;
  readonly profileCompleted: boolean;
  readonly updatedAt: Date;
}

export type ProfessionalRole = 
  | 'fisioterapeuta'
  | 'medico'
  | 'enfermero'
  | 'terapeuta_ocupacional'
  | 'psicologo'
  | 'admin';

// =====================================================
// AUTHENTICATION OPERATIONS
// =====================================================

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface RegisterData {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly organization: string;
  readonly role: ProfessionalRole;
  readonly specialization: string;
  readonly licenseNumber: string;
  readonly country: string;
}

export interface AuthResult {
  readonly user: UserIdentity;
  readonly profile: UserProfile | null;
  readonly sessionToken: string;
}

// =====================================================
// ERROR TYPES - ESPECÍFICOS Y TIPADOS
// =====================================================

export type AuthErrorCode =
  | 'auth/email-already-in-use'
  | 'auth/invalid-credential'
  | 'auth/weak-password'
  | 'auth/network-error'
  | 'auth/profile-incomplete'
  | 'auth/unauthorized'
  | 'auth/session-expired';

export interface AuthError {
  readonly code: AuthErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: Date;
}

// =====================================================
// SERVICE INTERFACES - REPOSITORY PATTERN
// =====================================================

export interface IAuthRepository {
  register(data: RegisterData): Promise<AuthResult>;
  login(credentials: LoginCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<UserIdentity | null>;
  verifyEmail(token: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

export interface IUserProfileRepository {
  create(profile: Omit<UserProfile, 'updatedAt'>): Promise<UserProfile>;
  getByUserId(userId: string): Promise<UserProfile | null>;
  update(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  markAsCompleted(userId: string): Promise<void>;
}

// =====================================================
// FUTURE-READY: MFA TYPES
// =====================================================

export interface MFAOptions {
  readonly enabled: boolean;
  readonly methods: Array<'sms' | 'email' | 'authenticator'>;
  readonly requiredForRole: boolean;
}

export interface AuthSession {
  readonly user: UserIdentity;
  readonly profile: UserProfile;
  readonly permissions: string[];
  readonly mfaVerified: boolean;
  readonly expiresAt: Date;
}