/**
 * 📧 EMAIL SERVICE - SERVICIO DE ENVÍO DE EMAILS
 * Sistema de envío de emails para recuperación de contraseña y autenticación
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface PasswordResetData {
  email: string;
  name: string;
  resetToken: string;
  resetLink: string;
  expiresAt: string;
}

class EmailService {
  private static readonly BASE_URL = window.location.origin;

  /**
   * Generar token de recuperación seguro
   */
  static generateResetToken(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Crear link de recuperación de contraseña
   */
  static createPasswordResetLink(email: string, token: string): string {
    const params = new URLSearchParams({
      email: email,
      token: token,
      action: 'reset-password'
    });
    return `${this.BASE_URL}/auth?${params.toString()}`;
  }

  /**
   * Template de email para recuperación de contraseña
   */
  static createPasswordResetTemplate(data: PasswordResetData): EmailTemplate {
    const expiresDate = new Date(data.expiresAt).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperar Contraseña - AiDuxCare</title>
        <style>
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            line-height: 1.6; 
            color: #2C3E50; 
            background: #F7F7F7; 
            margin: 0; 
            padding: 20px; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
            overflow: hidden; 
          }
          .header { 
            background: linear-gradient(135deg, #5DA5A3 0%, #4A8280 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .logo { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 8px; 
          }
          .subtitle { 
            opacity: 0.9; 
            font-size: 14px; 
          }
          .content { 
            padding: 40px 30px; 
          }
          .greeting { 
            font-size: 18px; 
            font-weight: 600; 
            margin-bottom: 20px; 
          }
          .message { 
            margin-bottom: 30px; 
            line-height: 1.7; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #5DA5A3 0%, #4A8280 100%); 
            color: white; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 12px; 
            font-weight: 600; 
            font-size: 16px; 
            text-align: center; 
            margin: 20px 0; 
          }
          .button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 25px rgba(93, 165, 163, 0.3); 
          }
          .security-info { 
            background: #F8F9FA; 
            border-left: 4px solid #5DA5A3; 
            padding: 20px; 
            margin: 30px 0; 
            border-radius: 8px; 
          }
          .footer { 
            background: #F8F9FA; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #E9ECEF; 
            font-size: 14px; 
            color: #6C757D; 
          }
          .footer-icons { 
            margin-top: 20px; 
          }
          .footer-icons span { 
            margin: 0 10px; 
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 30px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">MEDICAL AiDuxCare</div>
            <div class="subtitle">Plataforma Médica AI-EMR</div>
          </div>
          
          <div class="content">
            <div class="greeting">Hola ${data.name},</div>
            
            <div class="message">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en AiDuxCare.
              <br><br>
              Si fuiste tú quien solicitó este cambio, haz clic en el botón de abajo para crear una nueva contraseña:
            </div>
            
            <div style="text-align: center;">
              <a href="${data.resetLink}" class="button">
                SECURITY Restablecer Contraseña
              </a>
            </div>
            
            <div class="security-info">
              <strong>SECURITY: Información de Seguridad:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Este enlace es válido hasta: <strong>${expiresDate}</strong></li>
                <li>Solo puedes usar este enlace una vez</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
                <li>Tu contraseña actual sigue siendo válida hasta que la cambies</li>
              </ul>
            </div>
            
            <div class="message" style="font-size: 14px; color: #6C757D;">
              Si tienes problemas con el botón, copia y pega este enlace en tu navegador:
              <br>
              <a href="${data.resetLink}" style="color: #5DA5A3; word-break: break-all;">${data.resetLink}</a>
            </div>
          </div>
          
          <div class="footer">
            <div>
              <strong>AiDuxCare</strong> - Plataforma Médica Profesional
            </div>
            <div class="footer-icons">
              <span>SECURE Datos seguros</span>
              <span>MEDICAL HIPAA Compliant</span>
              <span>SEARCH Auditoría médica</span>
            </div>
            <div style="margin-top: 15px; font-size: 12px;">
              Este es un email automático, no respondas a este mensaje.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
AiDuxCare - Recuperar Contraseña

Hola ${data.name},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en AiDuxCare.

Si fuiste tú quien solicitó este cambio, visita el siguiente enlace para crear una nueva contraseña:
${data.resetLink}

INFORMACIÓN DE SEGURIDAD:
- Este enlace es válido hasta: ${expiresDate}
- Solo puedes usar este enlace una vez
- Si no solicitaste este cambio, ignora este email
- Tu contraseña actual sigue siendo válida hasta que la cambies

---
AiDuxCare - Plataforma Médica Profesional
SECURE Datos seguros • MEDICAL HIPAA Compliant • SEARCH Auditoría médica

Este es un email automático, no respondas a este mensaje.
    `.trim();

    return {
      subject: `SECURITY Restablecer contraseña - AiDuxCare`,
      html,
      text
    };
  }

  /**
   * Simular envío de email (en producción usaríamos un servicio real)
   */
  static async sendPasswordResetEmail(email: string, name: string): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
    resetLink?: string;
  }> {
    try {
      // Generar token y link
      const resetToken = this.generateResetToken();
      const resetLink = this.createPasswordResetLink(email, resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

      // Guardar token en localStorage para validación
      const resetData = {
        email,
        token: resetToken,
        expiresAt,
        used: false
      };
      
      const existingResets = JSON.parse(localStorage.getItem('aiduxcare_password_resets') || '[]');
      // Limpiar tokens expirados
      const validResets = existingResets.filter((reset: any) => 
        new Date(reset.expiresAt) > new Date()
      );
      validResets.push(resetData);
      localStorage.setItem('aiduxcare_password_resets', JSON.stringify(validResets));

      // Crear template del email
      const emailData: PasswordResetData = {
        email,
        name,
        resetToken,
        resetLink,
        expiresAt
      };
      
      const template = this.createPasswordResetTemplate(emailData);

      // En desarrollo, mostrar el email en consola
      console.log('📧 EMAIL DE RECUPERACIÓN ENVIADO:');
      console.log('==================================');
      console.log(`Para: ${email}`);
      console.log(`Asunto: ${template.subject}`);
      console.log(`Link: ${resetLink}`);
      console.log('==================================');
      
      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        message: `Email de recuperación enviado a ${email}. Revisa tu bandeja de entrada.`,
        resetToken,
        resetLink
      };

    } catch (error) {
      console.error('Error enviando email:', error);
      return {
        success: false,
        message: 'Error interno enviando el email. Intenta nuevamente.'
      };
    }
  }

  /**
   * Validar token de recuperación
   */
  static validateResetToken(email: string, token: string): {
    valid: boolean;
    message: string;
  } {
    try {
      const resets = JSON.parse(localStorage.getItem('aiduxcare_password_resets') || '[]');
      const resetData = resets.find((reset: any) => 
        reset.email === email && reset.token === token
      );

      if (!resetData) {
        return {
          valid: false,
          message: 'Token de recuperación inválido o expirado.'
        };
      }

      if (resetData.used) {
        return {
          valid: false,
          message: 'Este token ya ha sido utilizado.'
        };
      }

      if (new Date(resetData.expiresAt) <= new Date()) {
        return {
          valid: false,
          message: 'El token de recuperación ha expirado.'
        };
      }

      return {
        valid: true,
        message: 'Token válido.'
      };

    } catch (error) {
      return {
        valid: false,
        message: 'Error validando el token.'
      };
    }
  }

  /**
   * Marcar token como usado
   */
  static markTokenAsUsed(email: string, token: string): void {
    try {
      const resets = JSON.parse(localStorage.getItem('aiduxcare_password_resets') || '[]');
      const resetIndex = resets.findIndex((reset: any) => 
        reset.email === email && reset.token === token
      );

      if (resetIndex >= 0) {
        resets[resetIndex].used = true;
        localStorage.setItem('aiduxcare_password_resets', JSON.stringify(resets));
      }
    } catch (error) {
      console.error('Error marcando token como usado:', error);
    }
  }
}

export default EmailService; 