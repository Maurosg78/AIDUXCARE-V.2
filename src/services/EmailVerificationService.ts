import logger from '@/shared/utils/logger';

const maskEmailForLog = (email: string): string => {
  if (!email) {
    return 'missing';
  }

  const parts = email.split('@');
  const localPart = parts[0] || '';
  const domainPart = parts[1] || '';
  const visibleLocalPart = localPart.slice(0, 2);
  return `${visibleLocalPart}***@${domainPart || 'hidden'}`;
};

const maskTokenForLog = (token: string): string => {
  if (!token) {
    return 'missing';
  }

  const visiblePrefix = token.slice(0, 4);
  return `${visiblePrefix}...`;
};


export interface EmailVerificationData {
  email: string;
  token: string;
  professionalName: string;
  profession: string;
  expiresAt: Date;
}

export interface WelcomeEmailData {
  email: string;
  professionalName: string;
  profession: string;
  verificationUrl: string;
}

class EmailVerificationService {
  private readonly BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  /**
   * Envía email de bienvenida con link de verificación
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/email/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      return false;
    }
  }

  /**
   * Reenvía email de verificación
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/email/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`Error reenviando email: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error reenviando email de verificación:', error);
      return false;
    }
  }

  /**
   * Verifica el token de email
   */
  async verifyEmailToken(token: string): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'Error verificando email',
        };
      }

      return {
        success: true,
        message: 'Email verificado exitosamente',
        userId: result.userId,
      };
    } catch (error) {
      console.error('Error verificando token:', error);
      return {
        success: false,
        message: 'Error de conexión al verificar email',
      };
    }
  }

  /**
   * Genera un token de verificación único
   */
  generateVerificationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Genera la URL de verificación
   */
  generateVerificationUrl(token: string, email: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/onboarding-confirmation?token=${token}&email=${encodeURIComponent(email)}`;
  }

  /**
   * Simula el envío de email (para desarrollo)
   */
  async simulateWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    console.log('📧 SIMULANDO ENVÍO DE EMAIL DE BIENVENIDA:');
    console.log('📧 Para:', maskEmailForLog(data.email));
    console.log('📧 Nombre disponible:', Boolean(data.professionalName));
    console.log('📧 Profesión:', data.profession);
    console.log('📧 URL de verificación generada');
    console.log('📧 Email simulado enviado exitosamente');
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }

  /**
   * Simula la verificación de email (para desarrollo)
   */
  async simulateEmailVerification(token: string): Promise<{ success: boolean; message: string; userId?: string }> {
    console.log('🔍 SIMULANDO VERIFICACIÓN DE EMAIL:');
    console.log('🔍 Token:', maskTokenForLog(token));
    console.log('🔍 Verificación simulado exitosa');
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      message: 'Email verificado exitosamente (simulado)',
      userId: 'user-simulated-123',
    };
  }
}

export const emailVerificationService = new EmailVerificationService(); 
