/**
 * 🏥 CLINICAL ASSISTANT SERVICE - MOTOR DE ASISTENCIA CLÍNICA INTELIGENTE
 * 
 * Servicio principal que transforma AiDuxCare de un simple transcriptor
 * a una herramienta de asistencia clínica que mejora la seguridad y calidad.
 */

// === INTERFACES PRINCIPALES ===

export interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  condition: string;
  allergies: string[];
  medications: string[];
  clinicalHistory: string;
  derivadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalEntity {
  id: string;
  text: string;
  type: string;
  confidence: number;
}

// === INTERFACES DEL ASISTENTE CLÍNICO ===

export interface RedFlag {
  id: string;
  type: 'MEDICATION_ALLERGY' | 'CONTRAINDICATION' | 'CRITICAL_SYMPTOM' | 'DOSAGE_WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  relatedEntities: string[];
  confidence: number;
  timestamp: string;
}

export interface ExamTemplate {
  id: string;
  condition: string;
  title: string;
  description: string;
  tests: ExamTest[];
  estimatedTime: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

export interface ExamTest {
  id: string;
  name: string;
  description: string;
  type: 'PHYSICAL' | 'RANGE_OF_MOTION' | 'STRENGTH' | 'NEUROLOGICAL' | 'FUNCTIONAL';
  instructions: string;
  normalRange?: string;
  isCompleted: boolean;
  result?: string;
  notes?: string;
}

export interface ClinicalSuggestion {
  id: string;
  type: 'RED_FLAG' | 'EXAM_TEMPLATE' | 'SOAP_ENHANCEMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  actionRequired: boolean;
  isAccepted?: boolean;
  isDismissed?: boolean;
  timestamp: string;
  data: RedFlag | ExamTemplate | any;
}

export interface ClinicalAnalysisResult {
  redFlags: RedFlag[];
  examTemplates: ExamTemplate[];
  suggestions: ClinicalSuggestion[];
  riskScore: number;
  confidence: number;
  processingTime: number;
}

// === MOTOR DE ASISTENCIA CLÍNICA ===

class ClinicalAssistantService {
  
  /**
   * Detecta banderas rojas analizando entidades clínicas vs historial del paciente
   */
  public async detectRedFlags(
    entities: ClinicalEntity[], 
    patient: Patient
  ): Promise<RedFlag[]> {
    const redFlags: RedFlag[] = [];
    const startTime = Date.now();

    try {
      // 1. Detección de conflictos medicamento-alergia
      const medicationAllergyFlags = this.detectMedicationAllergyConflicts(entities, patient);
      redFlags.push(...medicationAllergyFlags);

      // 2. Detección de contraindicaciones
      const contraindicationFlags = this.detectContraindications(entities, patient);
      redFlags.push(...contraindicationFlags);

      // 3. Detección de síntomas críticos
      const criticalSymptomFlags = this.detectCriticalSymptoms(entities);
      redFlags.push(...criticalSymptomFlags);

      console.log(`🚨 Banderas rojas detectadas: ${redFlags.length} en ${Date.now() - startTime}ms`);
      
      return redFlags.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
      
    } catch (error) {
      console.error('❌ Error detectando banderas rojas:', error);
      return [];
    }
  }

  /**
   * Detecta conflictos entre medicamentos mencionados y alergias del paciente
   */
  private detectMedicationAllergyConflicts(entities: ClinicalEntity[], patient: Patient): RedFlag[] {
    const flags: RedFlag[] = [];
    
    const medications = entities.filter(e => e.type === 'MEDICATION');
    const patientAllergies = patient.allergies || [];

    medications.forEach(medication => {
      const conflictingAllergies = patientAllergies.filter(allergy => 
        this.isMedicationAllergyConflict(medication.text, allergy)
      );

      conflictingAllergies.forEach(allergy => {
        flags.push({
          id: `med-allergy-${Date.now()}-${Math.random()}`,
          type: 'MEDICATION_ALLERGY',
          severity: 'CRITICAL',
          title: '⚠️ ALERTA: Conflicto Medicamento-Alergia',
          description: `El paciente tiene alergia a "${allergy}" y se mencionó "${medication.text}" en la consulta.`,
          recommendation: 'Verificar inmediatamente la compatibilidad antes de prescribir. Considerar alternativas terapéuticas.',
          relatedEntities: [medication.text, allergy],
          confidence: medication.confidence * 0.9,
          timestamp: new Date().toISOString()
        });
      });
    });

    return flags;
  }

  /**
   * Detecta contraindicaciones basadas en condiciones del paciente
   */
  private detectContraindications(entities: ClinicalEntity[], patient: Patient): RedFlag[] {
    const flags: RedFlag[] = [];
    
    const medications = entities.filter(e => e.type === 'MEDICATION');
    const procedures = entities.filter(e => e.type === 'PROCEDURE');
    
    const contraindications = this.getContraindicationDatabase();
    
    [...medications, ...procedures].forEach(entity => {
      const conflicts = contraindications.filter(contra => 
        contra.entity.toLowerCase().includes(entity.text.toLowerCase()) &&
        contra.conditions.some(condition => 
          patient.condition.toLowerCase().includes(condition.toLowerCase()) ||
          patient.clinicalHistory.toLowerCase().includes(condition.toLowerCase())
        )
      );

      conflicts.forEach(conflict => {
        flags.push({
          id: `contraindication-${Date.now()}-${Math.random()}`,
          type: 'CONTRAINDICATION',
          severity: conflict.severity,
          title: `⚠️ Posible Contraindicación: ${entity.text}`,
          description: conflict.description,
          recommendation: conflict.recommendation,
          relatedEntities: [entity.text, ...conflict.conditions],
          confidence: entity.confidence * 0.8,
          timestamp: new Date().toISOString()
        });
      });
    });

    return flags;
  }

  /**
   * Detecta síntomas que requieren atención inmediata
   */
  private detectCriticalSymptoms(entities: ClinicalEntity[]): RedFlag[] {
    const flags: RedFlag[] = [];
    
    const symptoms = entities.filter(e => e.type === 'SYMPTOM');
    const criticalSymptoms = this.getCriticalSymptomsDatabase();

    symptoms.forEach(symptom => {
      const criticalMatch = criticalSymptoms.find(critical => 
        symptom.text.toLowerCase().includes(critical.keyword.toLowerCase())
      );

      if (criticalMatch) {
        flags.push({
          id: `critical-symptom-${Date.now()}-${Math.random()}`,
          type: 'CRITICAL_SYMPTOM',
          severity: criticalMatch.severity,
          title: `🚨 Síntoma Crítico Detectado: ${symptom.text}`,
          description: criticalMatch.description,
          recommendation: criticalMatch.recommendation,
          relatedEntities: [symptom.text],
          confidence: symptom.confidence * 0.95,
          timestamp: new Date().toISOString()
        });
      }
    });

    return flags;
  }

  /**
   * Sugiere plantillas de examen basadas en condiciones detectadas
   */
  public async suggestExamTemplates(entities: ClinicalEntity[], patient: Patient): Promise<ExamTemplate[]> {
    const templates: ExamTemplate[] = [];
    const startTime = Date.now();

    try {
      const conditions = entities.filter(e => e.type === 'CONDITION');
      const symptoms = entities.filter(e => e.type === 'SYMPTOM');
      const anatomy = entities.filter(e => e.type === 'ANATOMY');

      const relevantEntities = [...conditions, ...symptoms, ...anatomy];
      const examDatabase = this.getExamTemplateDatabase();

      relevantEntities.forEach(entity => {
        const matchingTemplates = examDatabase.filter(template =>
          template.keywords.some(keyword =>
            entity.text.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        matchingTemplates.forEach(templateData => {
          const template: ExamTemplate = {
            id: `exam-${Date.now()}-${Math.random()}`,
            condition: entity.text,
            title: templateData.title,
            description: templateData.description,
            tests: templateData.tests.map(test => ({
              ...test,
              id: `test-${Date.now()}-${Math.random()}`,
              isCompleted: false
            })),
            estimatedTime: templateData.estimatedTime,
            priority: templateData.priority,
            confidence: entity.confidence * 0.85
          };

          if (!templates.some(t => t.title === template.title)) {
            templates.push(template);
          }
        });
      });

      console.log(`📋 Plantillas de examen sugeridas: ${templates.length} en ${Date.now() - startTime}ms`);
      
      return templates.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
      
    } catch (error) {
      console.error('❌ Error sugiriendo plantillas de examen:', error);
      return [];
    }
  }

  /**
   * Realiza análisis contextual completo post-NER
   */
  public async performClinicalAnalysis(
    entities: ClinicalEntity[], 
    patient: Patient
  ): Promise<ClinicalAnalysisResult> {
    const startTime = Date.now();

    try {
      console.log('🔍 Iniciando análisis clínico completo...');

      const [redFlags, examTemplates] = await Promise.all([
        this.detectRedFlags(entities, patient),
        this.suggestExamTemplates(entities, patient)
      ]);

      const suggestions = this.generateClinicalSuggestions(redFlags, examTemplates);
      const riskScore = this.calculateRiskScore(redFlags, entities);
      const confidence = this.calculateOverallConfidence(entities, redFlags, examTemplates);
      const processingTime = Date.now() - startTime;

      const result: ClinicalAnalysisResult = {
        redFlags,
        examTemplates,
        suggestions,
        riskScore,
        confidence,
        processingTime
      };

      console.log(`✅ Análisis clínico completado en ${processingTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ Error en análisis clínico:', error);
      return {
        redFlags: [],
        examTemplates: [],
        suggestions: [],
        riskScore: 0,
        confidence: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  // === MÉTODOS AUXILIARES ===

  private isMedicationAllergyConflict(medication: string, allergy: string): boolean {
    const medLower = medication.toLowerCase();
    const allergyLower = allergy.toLowerCase();
    
    if (medLower === allergyLower) return true;
    if (medLower.includes(allergyLower) || allergyLower.includes(medLower)) return true;
    
    const drugGroups = this.getDrugGroupsDatabase();
    
    return drugGroups.some(group => 
      group.medications.some(med => medLower.includes(med.toLowerCase())) &&
      group.allergies.some(all => allergyLower.includes(all.toLowerCase()))
    );
  }

  private getSeverityWeight(severity: RedFlag['severity']): number {
    switch (severity) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  private getPriorityWeight(priority: ExamTemplate['priority']): number {
    switch (priority) {
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  private generateClinicalSuggestions(redFlags: RedFlag[], examTemplates: ExamTemplate[]): ClinicalSuggestion[] {
    const suggestions: ClinicalSuggestion[] = [];

    redFlags.forEach(flag => {
      suggestions.push({
        id: `suggestion-rf-${flag.id}`,
        type: 'RED_FLAG',
        priority: flag.severity === 'CRITICAL' ? 'CRITICAL' : flag.severity,
        title: flag.title,
        description: flag.description,
        actionRequired: flag.severity === 'CRITICAL' || flag.severity === 'HIGH',
        timestamp: flag.timestamp,
        data: flag
      });
    });

    examTemplates.forEach(template => {
      suggestions.push({
        id: `suggestion-et-${template.id}`,
        type: 'EXAM_TEMPLATE',
        priority: template.priority,
        title: `Plantilla sugerida: ${template.title}`,
        description: template.description,
        actionRequired: template.priority === 'HIGH',
        timestamp: new Date().toISOString(),
        data: template
      });
    });

    return suggestions.sort((a, b) => this.getPriorityWeight(b.priority as any) - this.getPriorityWeight(a.priority as any));
  }

  private calculateRiskScore(redFlags: RedFlag[], entities: ClinicalEntity[]): number {
    let score = 0;
    
    redFlags.forEach(flag => {
      switch (flag.severity) {
        case 'CRITICAL': score += 25; break;
        case 'HIGH': score += 15; break;
        case 'MEDIUM': score += 8; break;
        case 'LOW': score += 3; break;
      }
    });

    const complexityScore = Math.min(entities.length * 2, 20);
    score += complexityScore;

    return Math.min(score, 100);
  }

  private calculateOverallConfidence(entities: ClinicalEntity[], redFlags: RedFlag[], examTemplates: ExamTemplate[]): number {
    if (entities.length === 0) return 0;

    const entityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
    const flagConfidence = redFlags.length > 0 ? redFlags.reduce((sum, f) => sum + f.confidence, 0) / redFlags.length : 1;
    const templateConfidence = examTemplates.length > 0 ? examTemplates.reduce((sum, t) => sum + t.confidence, 0) / examTemplates.length : 1;

    return (entityConfidence + flagConfidence + templateConfidence) / 3;
  }

  // === BASES DE CONOCIMIENTO ===

  private getContraindicationDatabase() {
    return [
      {
        entity: 'ibuprofeno',
        conditions: ['úlcera gástrica', 'insuficiencia renal', 'hipertensión'],
        severity: 'HIGH' as const,
        description: 'El ibuprofeno puede agravar úlceras gástricas y problemas renales.',
        recommendation: 'Considerar paracetamol como alternativa más segura.'
      },
      {
        entity: 'manipulación cervical',
        conditions: ['artritis reumatoide', 'osteoporosis severa'],
        severity: 'CRITICAL' as const,
        description: 'La manipulación cervical está contraindicada por riesgo de lesión grave.',
        recommendation: 'Utilizar técnicas de movilización suave.'
      }
    ];
  }

  private getCriticalSymptomsDatabase() {
    return [
      {
        keyword: 'dolor torácico',
        severity: 'CRITICAL' as const,
        description: 'El dolor torácico puede indicar problemas cardíacos graves.',
        recommendation: 'Derivar inmediatamente a urgencias para evaluación cardiológica.'
      },
      {
        keyword: 'dificultad respiratoria',
        severity: 'CRITICAL' as const,
        description: 'La dificultad respiratoria requiere evaluación médica inmediata.',
        recommendation: 'Suspender tratamiento y derivar a urgencias.'
      }
    ];
  }

  private getDrugGroupsDatabase() {
    return [
      {
        medications: ['ibuprofeno', 'diclofenaco', 'naproxeno'],
        allergies: ['aines', 'antiinflamatorios', 'nsaid']
      },
      {
        medications: ['penicilina', 'amoxicilina'],
        allergies: ['penicilina', 'betalactámicos']
      }
    ];
  }

  private getExamTemplateDatabase() {
    return [
      {
        keywords: ['dolor lumbar', 'lumbalgia', 'espalda baja'],
        title: 'Evaluación de Dolor Lumbar',
        description: 'Protocolo completo para evaluación de dolor lumbar y función espinal.',
        estimatedTime: 15,
        priority: 'HIGH' as const,
        tests: [
          {
            name: 'Flexión Lumbar',
            description: 'Evaluación del rango de movimiento en flexión',
            type: 'RANGE_OF_MOTION' as const,
            instructions: 'Paciente de pie, flexionar tronco hacia adelante',
            normalRange: '80-90 grados'
          },
          {
            name: 'Test de Lasègue',
            description: 'Evaluación de compromiso radicular',
            type: 'NEUROLOGICAL' as const,
            instructions: 'Paciente supino, elevar pierna extendida',
            normalRange: 'Negativo hasta 70 grados'
          }
        ]
      },
      {
        keywords: ['dolor cervical', 'cervicalgia', 'cuello'],
        title: 'Evaluación Cervical Completa',
        description: 'Protocolo de evaluación para dolor y disfunción cervical.',
        estimatedTime: 12,
        priority: 'HIGH' as const,
        tests: [
          {
            name: 'Flexión Cervical',
            description: 'Rango de movimiento cervical en flexión',
            type: 'RANGE_OF_MOTION' as const,
            instructions: 'Llevar mentón hacia el pecho',
            normalRange: '45-50 grados'
          },
          {
            name: 'Test de Spurling',
            description: 'Evaluación de compromiso radicular cervical',
            type: 'NEUROLOGICAL' as const,
            instructions: 'Extensión, rotación y compresión axial',
            normalRange: 'Negativo'
          }
        ]
      }
    ];
  }
}

// === INSTANCIA SINGLETON ===
export const clinicalAssistantService = new ClinicalAssistantService();
export default clinicalAssistantService;
