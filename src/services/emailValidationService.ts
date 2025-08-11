/**
 * EmailValidationService - Validación temprana de email
 * Verifica si el email ya existe y ofrece opciones de recuperación
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

export interface EmailValidationResult {
  exists: boolean;
  isActive: boolean;
  lastLogin?: Date;
  canRecover: boolean;
  canActivate: boolean;
  message?: string;
}

export interface EmailRecoveryOptions {
  email: string;
  recoveryType: 'password' | 'activation' | 'both';
}

export class EmailValidationService {
  private static instance: EmailValidationService;
  private existingEmails: Set<string> = new Set([]);
  private activeEmails: Set<string> = new Set([]);

  public static getInstance(): EmailValidationService {
    if (!EmailValidationService.instance) {
      EmailValidationService.instance = new EmailValidationService();
    }
    return EmailValidationService.instance;
  }

  /**
   * Valida si el email ya existe en el sistema
   */
  public async validateEmail(email: string): Promise<EmailValidationResult> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    const exists = this.existingEmails.has(email.toLowerCase());
    const isActive = this.activeEmails.has(email.toLowerCase());

    if (!exists) {
      return {
        exists: false,
        isActive: false,
        canRecover: false,
        canActivate: false
      };
    }

    return {
      exists: true,
      isActive,
      lastLogin: isActive ? new Date(Date.now() - 24 * 60 * 60 * 1000) : undefined,
      canRecover: true,
      canActivate: !isActive,
      message: isActive 
        ? 'Esta cuenta ya está activa. ¿Olvidaste tu contraseña?'
        : 'Esta cuenta existe pero no está activada. ¿Quieres activarla?'
    };
  }

  /**
   * Envía email de recuperación de contraseña
   */
  public async sendPasswordRecovery(email: string): Promise<boolean> {
    // Simular envío de email
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`📧 Email de recuperación enviado a: ${email}`);
    return true;
  }

  /**
   * Envía email de activación de cuenta
   */
  public async sendAccountActivation(email: string): Promise<boolean> {
    // Simular envío de email
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`📧 Email de activación enviado a: ${email}`);
    return true;
  }

  /**
   * Verifica el formato del email
   */
  public validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const emailValidationService = EmailValidationService.getInstance(); 