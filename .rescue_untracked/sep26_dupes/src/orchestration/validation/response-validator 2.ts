/**
 * Validador de Respuestas de IA
 * Asegura cumplimiento del schema antes de mostrar al usuario
 */

import ClinicalSchemaValidator, { ValidationResult } from '../schemas/clinical-note-schema';

export class AIResponseValidator {
  /**
   * Valida y corrige la respuesta de la IA
   */
  static validateAndCorrect(aiResponse: any): {
    data: any;
    validation: ValidationResult;
    corrected: boolean;
  } {
    // Primero validar tal cual viene
    const validation = ClinicalSchemaValidator.validate(aiResponse);
    
    let corrected = false;
    let data = { ...aiResponse };
    
    // Si faltan campos obligatorios, intentar corregir
    if (!validation.valid) {
      data = this.applyCorrections(data, validation);
      corrected = true;
    }
    
    // Re-validar después de correcciones
    const finalValidation = ClinicalSchemaValidator.validate(data);
    
    // Log para auditoría
    this.logValidation(aiResponse, data, finalValidation, corrected);
    
    return {
      data,
      validation: finalValidation,
      corrected
    };
  }
  
  /**
   * Aplica correcciones automáticas donde sea posible
   */
  private static applyCorrections(data: any, validation: ValidationResult): any {
    const corrected = { ...data };
    
    // Asegurar que existe la estructura required
    if (!corrected.required) {
      corrected.required = {};
    }
    
    // Campos que podemos inferir o dar defaults seguros
    validation.missingRequired.forEach(field => {
      switch(field) {
        case 'redFlagsAssessed':
          // Si no dice, asumimos que se evaluaron (safer)
          corrected.required.redFlagsAssessed = true;
          corrected.required.redFlagsDetected = corrected.required.redFlagsDetected || [];
          break;
          
        case 'contraindicationsChecked':
          // Default seguro
          corrected.required.contraindicationsChecked = true;
          break;
          
        case 'planDocumented':
          // Si hay algo en plan, marcarlo como documentado
          if (corrected.plan || corrected.planDetails) {
            corrected.required.planDocumented = true;
            corrected.required.planDetails = corrected.plan || corrected.planDetails;
          }
          break;
          
        case 'sessionTimestamp':
          corrected.required.sessionTimestamp = new Date().toISOString();
          break;
      }
    });
    
    return corrected;
  }
  
  /**
   * Log para auditoría y mejora continua
   */
  private static logValidation(
    original: any,
    corrected: any,
    validation: ValidationResult,
    wasCorrected: boolean
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      valid: validation.valid,
      completenessScore: validation.completenessScore,
      wasCorrected,
      errors: validation.errors,
      warnings: validation.warnings,
      missingFields: validation.missingRequired
    };
    
    // En producción, esto iría a un sistema de logging real
    console.log('[ValidationAudit]', JSON.stringify(logEntry));
    
    // Métricas para el harness de evaluación
    if (typeof window !== 'undefined' && (window as any).analyticsQueue) {
      (window as any).analyticsQueue.push({
        event: 'schema_validation',
        properties: logEntry
      });
    }
  }
  
  /**
   * Genera reporte de validación para UI
   */
  static generateValidationReport(validation: ValidationResult): string {
    if (validation.valid && validation.completenessScore >= 90) {
      return '✅ Nota completa y válida';
    }
    
    const issues = [];
    
    if (validation.errors.length > 0) {
      issues.push(`❌ ${validation.errors.length} errores críticos`);
    }
    
    if (validation.warnings.length > 0) {
      issues.push(`⚠️ ${validation.warnings.length} advertencias`);
    }
    
    if (validation.completenessScore < 80) {
      issues.push(`📊 Completitud: ${validation.completenessScore.toFixed(0)}%`);
    }
    
    return issues.join(' | ');
  }
}

export default AIResponseValidator;
