import { Session, User } from '@supabase/supabase-js';

// ID único para el primer profesional
export const PROFESSIONAL_ID = 'prof-test-001';

// Mock de un usuario profesional
export const professionalUser: User = {
  id: PROFESSIONAL_ID,
  app_metadata: {
    provider: 'email'
  },
  user_metadata: {
    full_name: 'Dr. García Fernández',
    role: 'professional'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: '',
  email: 'dr.garcia@aiduxcare.com'
};

// Mock de sesión de usuario profesional
export const professionalSession: Session = {
  access_token: 'mock-access-token-for-professional',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'mock-refresh-token',
  user: professionalUser,
  expires_at: Math.floor(Date.now() / 1000) + 3600
}; 