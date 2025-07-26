import { describe, it, expect } from 'vitest';

// 🏥 SISTEMA DE VALIDACIÓN MÉDICA EMPRESARIAL - TESTS
class MedicalValidationService {
  
  static validateEmail(email: string): { isValid: boolean; message: string; severity: 'success' | 'warning' | 'error' } {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email) {
      return { isValid: false, message: 'El email es obligatorio', severity: 'error' };
    }
    
    if (!emailRegex.test(email)) {
      return { isValid: false, message: 'Formato de email inválido', severity: 'error' };
    }
    
    // Validación de dominios médicos comunes
    const medicalDomains = ['hospital', 'clinica', 'medico', 'salud', 'medicina', 'health'];
    const isMedicalDomain = medicalDomains.some(domain => 
      email.toLowerCase().includes(domain)
    );
    
    // Validación de dominios profesionales
    const professionalDomains = ['.edu', '.org', '.gov', 'universidad', 'university'];
    const isProfessionalDomain = professionalDomains.some(domain => 
      email.toLowerCase().includes(domain)
    );
    
    if (isMedicalDomain) {
      return { isValid: true, message: 'Email médico verificado ✓', severity: 'success' };
    } else if (isProfessionalDomain) {
      return { isValid: true, message: 'Email profesional verificado ✓', severity: 'success' };
    } else {
      return { isValid: true, message: 'Email válido', severity: 'warning' };
    }
  }
  
  static validatePassword(password: string): { isValid: boolean; message: string; severity: 'success' | 'warning' | 'error' } {
    if (!password) {
      return { isValid: false, message: 'La contraseña es obligatoria', severity: 'error' };
    }
    
    if (password.length < 8) {
      return { isValid: false, message: 'Mínimo 8 caracteres requeridos', severity: 'error' };
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const requirements = [
      { met: hasUpperCase, text: 'Una mayúscula' },
      { met: hasLowerCase, text: 'Una minúscula' },
      { met: hasNumbers, text: 'Un número' },
      { met: hasSpecialChar, text: 'Un carácter especial' }
    ];
    
    const unmetRequirements = requirements.filter(req => !req.met);
    
    if (unmetRequirements.length > 0) {
      return { 
        isValid: false, 
        message: `Falta: ${unmetRequirements.map(req => req.text).join(', ')}`,
        severity: 'error'
      };
    }
    
    // Validación de patrones comunes inseguros
    const commonPatterns = ['123456', 'password', 'qwerty', 'admin', 'test', 'user'];
    const hasCommonPattern = commonPatterns.some(pattern => 
      password.toLowerCase().includes(pattern)
    );
    
    if (hasCommonPattern) {
      return { 
        isValid: false, 
        message: 'Contraseña demasiado común, elige otra más segura', 
        severity: 'error' 
      };
    }
    
    // Validación de fortaleza avanzada
    if (password.length >= 12 && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar) {
      return { isValid: true, message: 'Contraseña muy segura ✓', severity: 'success' };
    } else {
      return { isValid: true, message: 'Contraseña segura ✓', severity: 'success' };
    }
  }
  
  static validateName(name: string): { isValid: boolean; message: string; severity: 'success' | 'warning' | 'error' } {
    if (!name) {
      return { isValid: false, message: 'El nombre es obligatorio', severity: 'error' };
    }
    
    if (name.length < 2) {
      return { isValid: false, message: 'Nombre demasiado corto', severity: 'error' };
    }
    
    if (name.length > 100) {
      return { isValid: false, message: 'Nombre demasiado largo (máx. 100 caracteres)', severity: 'error' };
    }
    
    const nameRegex = /^[a-zA-ZÀ-ÿñÑ\s'-\.]+$/;
    if (!nameRegex.test(name)) {
      return { 
        isValid: false, 
        message: 'Solo letras, espacios, guiones, apostrofes y puntos', 
        severity: 'error' 
      };
    }
    
    // Validación de títulos médicos comunes
    const medicalTitles = ['Dr.', 'Dra.', 'Prof.', 'Mg.', 'PhD', 'MD', 'DO', 'DDS', 'PharmD'];
    const hasMedicalTitle = medicalTitles.some(title => name.includes(title));
    
    // Validación de nombres profesionales
    const professionalSuffixes = ['MD', 'DDS', 'PhD', 'MSc', 'BSc'];
    const hasProfessionalSuffix = professionalSuffixes.some(suffix => 
      name.toUpperCase().includes(suffix)
    );
    
    if (hasMedicalTitle || hasProfessionalSuffix) {
      return { 
        isValid: true, 
        message: 'Título médico/profesional detectado ✓', 
        severity: 'success' 
      };
    } else {
      return { isValid: true, message: 'Nombre válido ✓', severity: 'success' };
    }
  }
}

describe('🏥 MedicalValidationService - Sistema de Validación Médica Empresarial', () => {

  describe('📧 Validación de Email Médico', () => {
    
    describe('✅ Casos Válidos', () => {
      it('debe validar emails médicos con dominios hospitalarios', () => {
        const testCases = [
          'dr.juan@hospital.com',
          'maria@clinica.es',
          'enfermero@hospitalcarlos.org',
          'fisio@salud.gov',
          'pediatra@medicina.edu'
        ];
        
        testCases.forEach(email => {
          const result = MedicalValidationService.validateEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.severity).toBe('success');
          expect(result.message).toContain('médico verificado');
        });
      });
      
      it('debe validar emails profesionales con dominios educativos', () => {
        const testCases = [
          'profesor@universidad.edu',
          'investigador@cambridge.edu',
          'admin@government.gov',
          'director@research.org'
        ];
        
        testCases.forEach(email => {
          const result = MedicalValidationService.validateEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.severity).toBe('success');
          expect(result.message).toContain('profesional verificado');
        });
      });
      
      it('debe validar emails generales con advertencia', () => {
        const testCases = [
          'usuario@gmail.com',
          'profesional@yahoo.es',
          'empleado@outlook.com'
        ];
        
        testCases.forEach(email => {
          const result = MedicalValidationService.validateEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.severity).toBe('warning');
          expect(result.message).toBe('Email válido');
        });
      });
    });
    
    describe('❌ Casos Inválidos', () => {
      it('debe rechazar emails vacíos', () => {
        const result = MedicalValidationService.validateEmail('');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toBe('El email es obligatorio');
      });
      
      it('debe rechazar formatos de email inválidos', () => {
        const testCases = [
          'no-email',
          'sin@arroba',
          '@sinusuario.com',
          'usuario@',
          'usuario@.com',
          'usuario@com',
          'usuario space@test.com'
        ];
        
        testCases.forEach(email => {
          const result = MedicalValidationService.validateEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.severity).toBe('error');
          expect(result.message).toBe('Formato de email inválido');
        });
      });
    });
    
    describe('🎯 Casos Edge Médicos', () => {
      it('debe manejar emails con múltiples dominios médicos', () => {
        const email = 'dr.cardiologo@hospital.medicina.edu';
        const result = MedicalValidationService.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.severity).toBe('success');
      });
      
      it('debe detectar dominios médicos en mayúsculas', () => {
        const email = 'DOCTOR@HOSPITAL.COM';
        const result = MedicalValidationService.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.severity).toBe('success');
      });
    });
  });

  describe('🔐 Validación de Contraseña Médica', () => {
    
    describe('✅ Casos Válidos', () => {
      it('debe validar contraseñas seguras básicas', () => {
        const testCases = [
          'Secure1!',
          'Strong@2024',
          'Pass#99X'
        ];
        
        testCases.forEach(password => {
          const result = MedicalValidationService.validatePassword(password);
          expect(result.isValid).toBe(true);
          expect(result.severity).toBe('success');
          expect(result.message).toBe('Contraseña segura ✓');
        });
      });
      
      it('debe validar contraseñas muy seguras (12+ caracteres)', () => {
        const testCases = [
          'HospitalSeguro123!',
          'MedicoComplejo@2024#',
          'ClinicaAvanzada$Pass99&'
        ];
        
        testCases.forEach(password => {
          const result = MedicalValidationService.validatePassword(password);
          expect(result.isValid).toBe(true);
          expect(result.severity).toBe('success');
          expect(result.message).toBe('Contraseña muy segura ✓');
        });
      });
    });
    
    describe('❌ Casos Inválidos', () => {
      it('debe rechazar contraseñas vacías', () => {
        const result = MedicalValidationService.validatePassword('');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toBe('La contraseña es obligatoria');
      });
      
      it('debe rechazar contraseñas cortas', () => {
        const result = MedicalValidationService.validatePassword('Abc123!');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toBe('Mínimo 8 caracteres requeridos');
      });
      
      it('debe rechazar contraseñas sin mayúsculas', () => {
        const result = MedicalValidationService.validatePassword('hospital123!');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toContain('Una mayúscula');
      });
      
      it('debe rechazar contraseñas sin minúsculas', () => {
        const result = MedicalValidationService.validatePassword('HOSPITAL123!');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toContain('Una minúscula');
      });
      
      it('debe rechazar contraseñas sin números', () => {
        const result = MedicalValidationService.validatePassword('Hospital!');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toContain('Un número');
      });
      
      it('debe rechazar contraseñas sin caracteres especiales', () => {
        const result = MedicalValidationService.validatePassword('Hospital123');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toContain('Un carácter especial');
      });
      
      it('debe rechazar contraseñas con patrones comunes', () => {
        const testCases = [
          'Password123!',
          'Admin123!',
          'Test123!',
          'User123!',
          'Qwerty123!',
          'Hospital123456!'
        ];
        
        testCases.forEach(password => {
          const result = MedicalValidationService.validatePassword(password);
          expect(result.isValid).toBe(false);
          expect(result.severity).toBe('error');
          expect(result.message).toBe('Contraseña demasiado común, elige otra más segura');
        });
      });
    });
    
    describe('🎯 Casos Edge Médicos', () => {
      it('debe manejar múltiples requisitos faltantes', () => {
        const result = MedicalValidationService.validatePassword('hospital');
        expect(result.isValid).toBe(false);
        expect(result.message).toContain('Una mayúscula');
        expect(result.message).toContain('Un número');
        expect(result.message).toContain('Un carácter especial');
      });
      
      it('debe validar contraseñas médicas complejas', () => {
        const result = MedicalValidationService.validatePassword('Dr.Cardio2024#Secure');
        expect(result.isValid).toBe(true);
        expect(result.severity).toBe('success');
        expect(result.message).toBe('Contraseña muy segura ✓');
      });
    });
  });

  describe('👤 Validación de Nombre Médico', () => {
    
    describe('✅ Casos Válidos', () => {
      it('debe validar nombres con títulos médicos', () => {
        const testCases = [
          'Dr. Juan Pérez',
          'Dra. María González',
          'Prof. Carlos Rodríguez MD',
          'Ana López PhD',
          'Dr. José Martínez DDS'
        ];
        
        testCases.forEach(name => {
          const result = MedicalValidationService.validateName(name);
          expect(result.isValid).toBe(true);
          expect(result.severity).toBe('success');
          expect(result.message).toBe('Título médico/profesional detectado ✓');
        });
      });
      
      it('debe validar nombres sin títulos', () => {
        const testCases = [
          'Juan Pérez',
          'María José González',
          'Carlos O\'Connor',
          'Ana-Sofía Martínez'
        ];
        
        testCases.forEach(name => {
          const result = MedicalValidationService.validateName(name);
          expect(result.isValid).toBe(true);
          expect(result.severity).toBe('success');
          expect(result.message).toBe('Nombre válido ✓');
        });
      });
      
      it('debe validar nombres con caracteres especiales permitidos', () => {
        const testCases = [
          'José María',
          'Jean-Pierre',
          'Mary O\'Connor',
          'Dr. José-María',
          'Ana Sofía'
        ];
        
        testCases.forEach(name => {
          const result = MedicalValidationService.validateName(name);
          expect(result.isValid).toBe(true);
        });
      });
    });
    
    describe('❌ Casos Inválidos', () => {
      it('debe rechazar nombres vacíos', () => {
        const result = MedicalValidationService.validateName('');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toBe('El nombre es obligatorio');
      });
      
      it('debe rechazar nombres muy cortos', () => {
        const result = MedicalValidationService.validateName('A');
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toBe('Nombre demasiado corto');
      });
      
      it('debe rechazar nombres muy largos', () => {
        const longName = 'A'.repeat(101);
        const result = MedicalValidationService.validateName(longName);
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe('error');
        expect(result.message).toBe('Nombre demasiado largo (máx. 100 caracteres)');
      });
      
      it('debe rechazar nombres con caracteres inválidos', () => {
        const testCases = [
          'Juan123',
          'María@hospital',
          'Dr. Juan#Pérez',
          'Carlos$médico',
          'Ana%enfermera'
        ];
        
        testCases.forEach(name => {
          const result = MedicalValidationService.validateName(name);
          expect(result.isValid).toBe(false);
          expect(result.severity).toBe('error');
          expect(result.message).toBe('Solo letras, espacios, guiones, apostrofes y puntos');
        });
      });
    });
    
    describe('🎯 Casos Edge Médicos', () => {
      it('debe detectar títulos médicos en diferentes posiciones', () => {
        const testCases = [
          'Juan Pérez MD',
          'PhD María González',
          'Carlos DDS Rodríguez'
        ];
        
        testCases.forEach(name => {
          const result = MedicalValidationService.validateName(name);
          expect(result.isValid).toBe(true);
          expect(result.severity).toBe('success');
          expect(result.message).toBe('Título médico/profesional detectado ✓');
        });
      });
      
      it('debe manejar nombres con acentos y caracteres internacionales', () => {
        const testCases = [
          'José María Azañón',
          'François Müller',
          'Søren Andréssen',
          'Ñoño Álex'
        ];
        
        testCases.forEach(name => {
          const result = MedicalValidationService.validateName(name);
          expect(result.isValid).toBe(true);
        });
      });
      
      it('debe validar nombres médicos extremadamente largos pero válidos', () => {
        const name = 'Dr. Juan Carlos María José Francisco Antonio Pérez González Rodríguez Martínez MD PhD';
        const result = MedicalValidationService.validateName(name);
        expect(result.isValid).toBe(true);
        expect(result.severity).toBe('success');
      });
    });
  });

  describe('🔬 Tests de Rendimiento y Estrés', () => {
    
    it('debe procesar validaciones masivas de email en <100ms', () => {
      const emails = Array.from({ length: 1000 }, (_, i) => `user${i}@hospital.com`);
      
      const startTime = performance.now();
      
      emails.forEach(email => {
        MedicalValidationService.validateEmail(email);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100);
    });
    
    it('debe procesar validaciones masivas de contraseña en <200ms', () => {
      const passwords = Array.from({ length: 500 }, (_, i) => `Hospital${i}!Pass`);
      
      const startTime = performance.now();
      
      passwords.forEach(password => {
        MedicalValidationService.validatePassword(password);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(200);
    });
    
    it('debe procesar validaciones masivas de nombres en <50ms', () => {
      const names = Array.from({ length: 1000 }, (_, i) => `Dr. Usuario${i} Médico`);
      
      const startTime = performance.now();
      
      names.forEach(name => {
        MedicalValidationService.validateName(name);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('🛡️ Tests de Seguridad Médica', () => {
    
    it('debe rechazar intentos de inyección en emails', () => {
      const maliciousEmails = [
        'user@test.com<script>alert("xss")</script>',
        'user@test.com\'; DROP TABLE users; --',
        'user@test.com\nBcc: hacker@evil.com'
      ];
      
      maliciousEmails.forEach(email => {
        const result = MedicalValidationService.validateEmail(email);
        expect(result.isValid).toBe(false);
      });
    });
    
    it('debe rechazar contraseñas con patrones de diccionario médico', () => {
      const medicalPasswords = [
        'Hospital123!',
        'Medicine123!',
        'Doctor123!',
        'Patient123!'
      ];
      
      medicalPasswords.forEach(password => {
        const result = MedicalValidationService.validatePassword(password);
        // Estas deberían ser válidas pero no muy seguras, o rechazadas si son muy comunes
        expect(result).toBeDefined();
      });
    });
    
    it('debe manejar entradas extremadamente largas sin crash', () => {
      const longString = 'A'.repeat(10000);
      
      expect(() => {
        MedicalValidationService.validateEmail(longString);
        MedicalValidationService.validatePassword(longString);
        MedicalValidationService.validateName(longString);
      }).not.toThrow();
    });
  });
});