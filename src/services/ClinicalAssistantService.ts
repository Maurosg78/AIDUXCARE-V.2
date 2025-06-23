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

export type ProfessionalRole = 'PHYSIOTHERAPIST' | 'PHYSICIAN' | 'NURSE' | 'PSYCHOLOGIST' | 'OCCUPATIONAL_THERAPIST';
export type Country = 'CHILE' | 'USA' | 'SPAIN' | 'MEXICO' | 'ARGENTINA' | 'COLOMBIA';
export type State = 'CALIFORNIA' | 'TEXAS' | 'NEW_YORK' | 'FLORIDA' | 'METROPOLITANA' | 'VALPARAISO' | 'BIOBIO';

export interface ProfessionalContext {
  role: ProfessionalRole;
  country: Country;
  state?: State;
  specializations?: string[];
  certifications?: string[];
  licenseNumber?: string;
}

export interface ProfessionalCapabilities {
  canPrescribeMedications: boolean;
  canOrderExams: boolean;
  canPerformProcedures: string[];
  canCreateExercisePrograms: boolean;
  canPerformManualTherapy: boolean;
  canPerformAcupuncture: boolean;
  canPerformDryNeedling: boolean;
  canPerformInvasiveProcedures: boolean;
  canReferToSpecialists: boolean;
  canDischargePatients: boolean;
  canModifyTreatmentPlans: boolean;
  restrictions: string[];
  requiredSupervision?: ProfessionalRole[];
}

export interface GeographicRestrictions {
  country: Country;
  state?: State;
  restrictions: {
    [procedure: string]: {
      allowed: boolean;
      conditions?: string[];
      supervisionRequired?: ProfessionalRole[];
      documentationRequired?: string[];
    };
  };
}

export interface RedFlag {
  id: string;
  type: 'MEDICATION_ALLERGY' | 'CONTRAINDICATION' | 'CRITICAL_SYMPTOM' | 'DOSAGE_WARNING' | 'REFERRAL_NEEDED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  recommendationForPhysician?: string; // Recomendación específica para médicos
  recommendationForPhysiotherapist?: string; // Recomendación específica para fisios
  soapNote?: string; // Texto para incluir en SOAP
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

export interface MedicationAdministration {
  id: string;
  medicationName: string;
  dosage: string;
  route: 'ORAL' | 'INTRAVENOUS' | 'INTRAMUSCULAR' | 'SUBCUTANEOUS' | 'TOPICAL' | 'INHALATION';
  frequency: string;
  administeredBy: string;
  administeredAt: string;
  patientId: string;
  prescriptionId?: string;
  notes?: string;
  status: 'PENDING' | 'ADMINISTERED' | 'MISSED' | 'REFUSED';
}

export interface MedicationPrescription {
  id: string;
  medicationName: string;
  dosage: string;
  route: 'ORAL' | 'INTRAVENOUS' | 'INTRAMUSCULAR' | 'SUBCUTANEOUS' | 'TOPICAL' | 'INHALATION';
  frequency: string;
  prescribedBy: string;
  prescribedAt: string;
  patientId: string;
  indication: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'DISCONTINUED' | 'COMPLETED';
  notes?: string;
}

export interface MedicationVerificationResult {
  isCompliant: boolean;
  discrepancies: string[];
  warnings: string[];
  recommendations: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface MedicalIndication {
  id: string;
  type: 'MEDICATION' | 'PROCEDURE' | 'EXAM' | 'REFERRAL' | 'TREATMENT_PLAN' | 'EXERCISE_PROGRAM';
  title: string;
  description: string;
  prescribedBy: string;
  prescribedAt: string;
  patientId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'MODIFIED';
  evidenceLevel?: 'A' | 'B' | 'C' | 'D'; // Nivel de evidencia científica
  contraindications?: string[];
  interactions?: string[];
  notes?: string;
}

export interface IndicationWarning {
  id: string;
  type: 'INTERACTION' | 'CONTRAINDICATION' | 'BLIND_SPOT' | 'LEGAL_RISK' | 'EVIDENCE_GAP' | 'SAFETY_CONCERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  recommendation: string;
  evidenceLevel?: 'A' | 'B' | 'C' | 'D';
  legalImplications?: string[];
  professionalContext?: ProfessionalRole[];
  isDismissible: boolean;
  requiresAcknowledgment: boolean;
  timestamp: string;
}

export interface TreatmentGuideline {
  id: string;
  condition: string;
  title: string;
  description: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  recommendations: string[];
  contraindications: string[];
  professionalRoles: ProfessionalRole[];
  country: Country;
  source: string;
  lastUpdated: string;
}

// === MOTOR DE ASISTENCIA CLÍNICA ===

class ClinicalAssistantService {
  
  /**
   * Detecta banderas rojas analizando entidades clínicas vs historial del paciente
   */
  public async detectRedFlags(
    entities: ClinicalEntity[], 
    patient: Patient,
    professionalContext: ProfessionalContext
  ): Promise<RedFlag[]> {
    const redFlags: RedFlag[] = [];
    const startTime = Date.now();

    try {
      // 1. Detección de conflictos medicamento-alergia
      const medicationAllergyFlags = this.detectMedicationAllergyConflicts(entities, patient, professionalContext);
      redFlags.push(...medicationAllergyFlags);

      // 2. Detección de contraindicaciones
      const contraindicationFlags = this.detectContraindications(entities, patient, professionalContext);
      redFlags.push(...contraindicationFlags);

      // 3. Detección de síntomas críticos
      const criticalSymptomFlags = this.detectCriticalSymptoms(entities, professionalContext);
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
  private detectMedicationAllergyConflicts(entities: ClinicalEntity[], patient: Patient, professionalContext: ProfessionalContext): RedFlag[] {
    const flags: RedFlag[] = [];
    
    const medications = entities.filter(e => e.type === 'MEDICATION');
    const patientAllergies = patient.allergies || [];

    medications.forEach(medication => {
      const conflictingAllergies = patientAllergies.filter(allergy => 
        this.isMedicationAllergyConflict(medication.text, allergy, professionalContext.role)
      );

      conflictingAllergies.forEach(allergy => {
        const contextualRec = this.getContextualRecommendation(
          'Verificar inmediatamente la compatibilidad antes de prescribir. Considerar alternativas terapéuticas.',
          professionalContext.role,
          'MEDICATION_ALLERGY',
          `${medication.text} vs ${allergy}`
        );

        flags.push({
          id: `med-allergy-${Date.now()}-${Math.random()}`,
          type: 'MEDICATION_ALLERGY',
          severity: 'CRITICAL',
          title: '⚠️ ALERTA: Conflicto Medicamento-Alergia',
          description: `El paciente tiene alergia a "${allergy}" y se mencionó "${medication.text}" en la consulta.`,
          recommendation: contextualRec.recommendation,
          soapNote: contextualRec.soapNote,
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
  private detectContraindications(entities: ClinicalEntity[], patient: Patient, professionalContext: ProfessionalContext): RedFlag[] {
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
        const contextualRec = this.getContextualRecommendation(
          conflict.recommendation,
          professionalContext.role,
          'CONTRAINDICATION',
          entity.text
        );

        flags.push({
          id: `contraindication-${Date.now()}-${Math.random()}`,
          type: 'CONTRAINDICATION',
          severity: conflict.severity,
          title: `⚠️ Posible Contraindicación: ${entity.text}`,
          description: conflict.description,
          recommendation: contextualRec.recommendation,
          soapNote: contextualRec.soapNote,
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
  private detectCriticalSymptoms(entities: ClinicalEntity[], professionalContext: ProfessionalContext): RedFlag[] {
    const flags: RedFlag[] = [];
    
    // Buscar en todos los tipos de entidades relevantes, no solo SYMPTOM
    const relevantEntities = entities.filter(e => 
      ['SYMPTOM', 'HISTORY', 'CONDITION', 'MEDICATION', 'FINDING'].includes(e.type)
    );
    
    const criticalSymptoms = this.getCriticalSymptomsDatabase();

    relevantEntities.forEach(entity => {
      const criticalMatch = criticalSymptoms.find(critical => 
        entity.text.toLowerCase().includes(critical.keyword.toLowerCase())
      );

      if (criticalMatch) {
        const contextualRec = this.getContextualRecommendation(
          criticalMatch.recommendation,
          professionalContext.role,
          'CRITICAL_SYMPTOM',
          entity.text
        );

        flags.push({
          id: `critical-symptom-${Date.now()}-${Math.random()}`,
          type: 'CRITICAL_SYMPTOM',
          severity: criticalMatch.severity,
          title: `🚨 Síntoma Crítico Detectado: ${entity.text}`,
          description: criticalMatch.description,
          recommendation: contextualRec.recommendation,
          soapNote: contextualRec.soapNote,
          relatedEntities: [entity.text],
          confidence: entity.confidence * 0.95,
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
        this.detectRedFlags(entities, patient, { role: 'PHYSIOTHERAPIST', country: 'CHILE' }),
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

  private isMedicationAllergyConflict(medication: string, allergy: string, professionalRole: ProfessionalRole): boolean {
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
        recommendation: 'Considerar paracetamol como alternativa más segura.',
        recommendationForPhysician: 'Considerar paracetamol como alternativa más segura.',
        recommendationForPhysiotherapist: 'Considerar paracetamol como alternativa más segura.',
        soapNote: 'Este conflicto debe ser evaluado por un médico y/o fisioterapeuta antes de la prescripción.'
      },
      {
        entity: 'manipulación cervical',
        conditions: ['artritis reumatoide', 'osteoporosis severa'],
        severity: 'CRITICAL' as const,
        description: 'La manipulación cervical está contraindicada por riesgo de lesión grave.',
        recommendation: 'Utilizar técnicas de movilización suave.',
        recommendationForPhysician: 'Utilizar técnicas de movilización suave.',
        recommendationForPhysiotherapist: 'Utilizar técnicas de movilización suave.',
        soapNote: 'Este conflicto debe ser evaluado por un médico y/o fisioterapeuta antes de la procedencia.'
      }
    ];
  }

  private getCriticalSymptomsDatabase() {
    return [
      {
        keyword: 'dolor torácico',
        severity: 'CRITICAL' as const,
        description: 'El dolor torácico puede indicar problemas cardíacos graves.',
        recommendation: 'Derivar inmediatamente a urgencias para evaluación cardiológica.',
        recommendationForPhysician: 'Derivar inmediatamente a urgencias para evaluación cardiológica.',
        recommendationForPhysiotherapist: 'Derivar inmediatamente a urgencias para evaluación cardiológica.',
        soapNote: 'Este síntoma crítico requiere atención médica inmediata.'
      },
      {
        keyword: 'dificultad respiratoria',
        severity: 'CRITICAL' as const,
        description: 'La dificultad respiratoria requiere evaluación médica inmediata.',
        recommendation: 'Suspender tratamiento y derivar a urgencias.',
        recommendationForPhysician: 'Suspender tratamiento y derivar a urgencias.',
        recommendationForPhysiotherapist: 'Suspender tratamiento y derivar a urgencias.',
        soapNote: 'Este síntoma crítico requiere atención médica inmediata.'
      },
      
      {
        keyword: 'pérdida control esfínteres',
        severity: 'CRITICAL' as const,
        description: 'Síndrome de cauda equina - emergencia neurológica que requiere intervención inmediata.',
        recommendation: 'DERIVACIÓN URGENTE a neurocirugía. Síntoma de emergencia neurológica.',
        recommendationForPhysician: 'DERIVACIÓN URGENTE a neurocirugía. Síntoma de emergencia neurológica.',
        recommendationForPhysiotherapist: 'DERIVACIÓN URGENTE a neurocirugía. Síntoma de emergencia neurológica.',
        soapNote: 'Este síntoma crítico requiere intervención inmediata.'
      },
      {
        keyword: 'incontinencia urinaria',
        severity: 'CRITICAL' as const,
        description: 'Pérdida de control urinario puede indicar síndrome de cauda equina.',
        recommendation: 'Evaluación neurológica urgente para descartar compresión medular.',
        recommendationForPhysician: 'Evaluación neurológica urgente para descartar compresión medular.',
        recommendationForPhysiotherapist: 'Evaluación neurológica urgente para descartar compresión medular.',
        soapNote: 'Este síntoma crítico requiere evaluación neurológica urgente.'
      },
      {
        keyword: 'incontinencia fecal',
        severity: 'CRITICAL' as const,
        description: 'Pérdida de control intestinal puede indicar síndrome de cauda equina.',
        recommendation: 'Evaluación neurológica urgente para descartar compresión medular.',
        recommendationForPhysician: 'Evaluación neurológica urgente para descartar compresión medular.',
        recommendationForPhysiotherapist: 'Evaluación neurológica urgente para descartar compresión medular.',
        soapNote: 'Este síntoma crítico requiere evaluación neurológica urgente.'
      },
      {
        keyword: 'pérdida peso',
        severity: 'HIGH' as const,
        description: 'Pérdida de peso involuntaria es un síntoma constitucional que requiere evaluación.',
        recommendation: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        recommendationForPhysician: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        recommendationForPhysiotherapist: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica o endocrina.'
      },
      {
        keyword: 'bajó peso',
        severity: 'HIGH' as const,
        description: 'Pérdida de peso reciente puede indicar patología sistémica.',
        recommendation: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        recommendationForPhysician: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        recommendationForPhysiotherapist: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica o endocrina.'
      },
      {
        keyword: 'pérdida 8 kilos',
        severity: 'HIGH' as const,
        description: 'Pérdida de peso significativa puede indicar patología sistémica.',
        recommendation: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        recommendationForPhysician: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        recommendationForPhysiotherapist: 'Evaluar causas subyacentes, considerar derivación a medicina interna.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica o endocrina.'
      },
      {
        keyword: 'antecedentes cáncer',
        severity: 'HIGH' as const,
        description: 'Factor de riesgo para metástasis y complicaciones oncológicas.',
        recommendation: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        recommendationForPhysician: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        recommendationForPhysiotherapist: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        soapNote: 'Este factor de riesgo requiere evaluación especializada.'
      },
      {
        keyword: 'historial cáncer',
        severity: 'HIGH' as const,
        description: 'Antecedentes oncológicos requieren evaluación especializada.',
        recommendation: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        recommendationForPhysician: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        recommendationForPhysiotherapist: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        soapNote: 'Este historial requiere evaluación especializada.'
      },
      {
        keyword: 'cáncer de mama',
        severity: 'HIGH' as const,
        description: 'Antecedentes de cáncer de mama requieren evaluación especializada.',
        recommendation: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        recommendationForPhysician: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        recommendationForPhysiotherapist: 'Evaluar posibilidad de metástasis, considerar estudios imagenológicos.',
        soapNote: 'Este antecedente requiere evaluación especializada.'
      },
      {
        keyword: 'anticoagulantes',
        severity: 'MEDIUM' as const,
        description: 'Riesgo hemorrágico en procedimientos y manipulaciones.',
        recommendation: 'Verificar INR/coagulación antes de procedimientos invasivos.',
        recommendationForPhysician: 'Verificar INR/coagulación antes de procedimientos invasivos.',
        recommendationForPhysiotherapist: 'Verificar INR/coagulación antes de procedimientos invasivos.',
        soapNote: 'Este riesgo requiere evaluación preoperatoria.'
      },
      {
        keyword: 'warfarina',
        severity: 'MEDIUM' as const,
        description: 'Anticoagulante que aumenta riesgo hemorrágico.',
        recommendation: 'Verificar INR antes de procedimientos, considerar alternativas.',
        recommendationForPhysician: 'Verificar INR antes de procedimientos, considerar alternativas.',
        recommendationForPhysiotherapist: 'Verificar INR antes de procedimientos, considerar alternativas.',
        soapNote: 'Este anticoagulante requiere evaluación preoperatoria.'
      },
      {
        keyword: 'aspirina',
        severity: 'MEDIUM' as const,
        description: 'Antiplaquetario que puede aumentar riesgo hemorrágico.',
        recommendation: 'Verificar coagulación antes de procedimientos invasivos.',
        recommendationForPhysician: 'Verificar coagulación antes de procedimientos invasivos.',
        recommendationForPhysiotherapist: 'Verificar coagulación antes de procedimientos invasivos.',
        soapNote: 'Este antiplaquetario requiere evaluación preoperatoria.'
      },
      {
        keyword: 'heparina',
        severity: 'MEDIUM' as const,
        description: 'Anticoagulante que aumenta riesgo hemorrágico.',
        recommendation: 'Verificar coagulación antes de procedimientos invasivos.',
        recommendationForPhysician: 'Verificar coagulación antes de procedimientos invasivos.',
        recommendationForPhysiotherapist: 'Verificar coagulación antes de procedimientos invasivos.',
        soapNote: 'Este anticoagulante requiere evaluación preoperatoria.'
      },
      {
        keyword: 'fatiga intensa',
        severity: 'MEDIUM' as const,
        description: 'Fatiga intensa puede indicar patología sistémica.',
        recommendation: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar causas subyacentes, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'pérdida apetito',
        severity: 'MEDIUM' as const,
        description: 'Pérdida de apetito puede indicar patología sistémica.',
        recommendation: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar causas subyacentes, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'suda por las noches',
        severity: 'MEDIUM' as const,
        description: 'Sudoración nocturna puede indicar patología sistémica.',
        recommendation: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar causas subyacentes, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'sudoración nocturna',
        severity: 'MEDIUM' as const,
        description: 'Sudoración nocturna puede indicar patología sistémica.',
        recommendation: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar causas subyacentes, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'palidez cutánea',
        severity: 'MEDIUM' as const,
        description: 'Palidez cutánea puede indicar anemia o patología sistémica.',
        recommendation: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar causas subyacentes, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar causas subyacentes, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'moretones frecuentes',
        severity: 'MEDIUM' as const,
        description: 'Moretones frecuentes pueden indicar trastorno de coagulación.',
        recommendation: 'Evaluar coagulación, considerar evaluación hematológica.',
        recommendationForPhysician: 'Evaluar coagulación, considerar evaluación hematológica.',
        recommendationForPhysiotherapist: 'Evaluar coagulación, considerar evaluación hematológica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'hematomas grandes',
        severity: 'MEDIUM' as const,
        description: 'Hematomas grandes pueden indicar trastorno de coagulación.',
        recommendation: 'Evaluar coagulación, considerar evaluación hematológica.',
        recommendationForPhysician: 'Evaluar coagulación, considerar evaluación hematológica.',
        recommendationForPhysiotherapist: 'Evaluar coagulación, considerar evaluación hematológica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'múltiples equimosis',
        severity: 'MEDIUM' as const,
        description: 'Múltiples equimosis pueden indicar trastorno de coagulación.',
        recommendation: 'Evaluar coagulación, considerar evaluación hematológica.',
        recommendationForPhysician: 'Evaluar coagulación, considerar evaluación hematológica.',
        recommendationForPhysiotherapist: 'Evaluar coagulación, considerar evaluación hematológica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'dolor irradiado',
        severity: 'HIGH' as const,
        description: 'Dolor que se irradia puede indicar compromiso radicular o visceral.',
        recommendation: 'Evaluar origen del dolor, considerar estudios imagenológicos.',
        recommendationForPhysician: 'Evaluar origen del dolor, considerar estudios imagenológicos.',
        recommendationForPhysiotherapist: 'Evaluar origen del dolor, considerar estudios imagenológicos.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'dolor se irradia',
        severity: 'HIGH' as const,
        description: 'Dolor que se irradia puede indicar compromiso radicular o visceral.',
        recommendation: 'Evaluar origen del dolor, considerar estudios imagenológicos.',
        recommendationForPhysician: 'Evaluar origen del dolor, considerar estudios imagenológicos.',
        recommendationForPhysiotherapist: 'Evaluar origen del dolor, considerar estudios imagenológicos.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'debilidad progresiva',
        severity: 'HIGH' as const,
        description: 'Debilidad progresiva puede indicar compromiso neurológico.',
        recommendation: 'Evaluación neurológica para descartar lesión medular o radicular.',
        recommendationForPhysician: 'Evaluación neurológica para descartar lesión medular o radicular.',
        recommendationForPhysiotherapist: 'Evaluación neurológica para descartar lesión medular o radicular.',
        soapNote: 'Este síntoma puede indicar una posible patología neurológica.'
      },
      {
        keyword: 'debilidad muscular',
        severity: 'HIGH' as const,
        description: 'Debilidad muscular puede indicar compromiso neurológico.',
        recommendation: 'Evaluación neurológica para descartar lesión medular o radicular.',
        recommendationForPhysician: 'Evaluación neurológica para descartar lesión medular o radicular.',
        recommendationForPhysiotherapist: 'Evaluación neurológica para descartar lesión medular o radicular.',
        soapNote: 'Este síntoma puede indicar una posible patología neurológica.'
      },
      {
        keyword: 'pérdida fuerza',
        severity: 'HIGH' as const,
        description: 'Pérdida de fuerza puede indicar compromiso neurológico.',
        recommendation: 'Evaluación neurológica para descartar lesión medular o radicular.',
        recommendationForPhysician: 'Evaluación neurológica para descartar lesión medular o radicular.',
        recommendationForPhysiotherapist: 'Evaluación neurológica para descartar lesión medular o radicular.',
        soapNote: 'Este síntoma puede indicar una posible patología neurológica.'
      },
      {
        keyword: 'entumecimiento silla de montar',
        severity: 'CRITICAL' as const,
        description: 'Entumecimiento en silla de montar puede indicar síndrome de cauda equina.',
        recommendation: 'Evaluación neurológica urgente para descartar compresión medular.',
        recommendationForPhysician: 'Evaluación neurológica urgente para descartar compresión medular.',
        recommendationForPhysiotherapist: 'Evaluación neurológica urgente para descartar compresión medular.',
        soapNote: 'Este síntoma crítico requiere evaluación neurológica urgente.'
      },
      {
        keyword: 'hormigueo',
        severity: 'MEDIUM' as const,
        description: 'Parestesias pueden indicar compromiso neurológico.',
        recommendation: 'Evaluar distribución y características de las parestesias.',
        recommendationForPhysician: 'Evaluar distribución y características de las parestesias.',
        recommendationForPhysiotherapist: 'Evaluar distribución y características de las parestesias.',
        soapNote: 'Este síntoma puede indicar una posible patología neurológica.'
      },
      {
        keyword: 'parestesias',
        severity: 'MEDIUM' as const,
        description: 'Alteraciones de la sensibilidad pueden indicar compromiso neurológico.',
        recommendation: 'Evaluar distribución y características de las alteraciones sensoriales.',
        recommendationForPhysician: 'Evaluar distribución y características de las alteraciones sensoriales.',
        recommendationForPhysiotherapist: 'Evaluar distribución y características de las alteraciones sensoriales.',
        soapNote: 'Este síntoma puede indicar una posible patología neurológica.'
      },
      {
        keyword: 'fiebre',
        severity: 'HIGH' as const,
        description: 'Fiebre puede indicar proceso infeccioso o inflamatorio.',
        recommendation: 'Evaluar causa de la fiebre, considerar derivación médica.',
        recommendationForPhysician: 'Evaluar causa de la fiebre, considerar derivación médica.',
        recommendationForPhysiotherapist: 'Evaluar causa de la fiebre, considerar derivación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'fiebre alta',
        severity: 'CRITICAL' as const,
        description: 'Fiebre alta puede indicar infección grave.',
        recommendation: 'Derivar a urgencias para evaluación médica inmediata.',
        recommendationForPhysician: 'Derivar a urgencias para evaluación médica inmediata.',
        recommendationForPhysiotherapist: 'Derivar a urgencias para evaluación médica inmediata.',
        soapNote: 'Este síntoma crítico requiere atención médica inmediata.'
      },
      {
        keyword: 'mareos',
        severity: 'MEDIUM' as const,
        description: 'Mareos pueden indicar alteraciones vestibulares o cardiovasculares.',
        recommendation: 'Evaluar causa de los mareos, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar causa de los mareos, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar causa de los mareos, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología cardiovascularen.'
      },
      {
        keyword: 'vértigo',
        severity: 'MEDIUM' as const,
        description: 'Vértigo puede indicar alteraciones vestibulares o neurológicas.',
        recommendation: 'Evaluar características del vértigo, considerar evaluación especializada.',
        recommendationForPhysician: 'Evaluar características del vértigo, considerar evaluación especializada.',
        recommendationForPhysiotherapist: 'Evaluar características del vértigo, considerar evaluación especializada.',
        soapNote: 'Este síntoma puede indicar una posible patología neurológica.'
      },
      {
        keyword: 'dolor de cabeza',
        severity: 'MEDIUM' as const,
        description: 'Cefalea puede indicar múltiples patologías.',
        recommendation: 'Evaluar características de la cefalea, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar características de la cefalea, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar características de la cefalea, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'cefalea',
        severity: 'MEDIUM' as const,
        description: 'Cefalea puede indicar múltiples patologías.',
        recommendation: 'Evaluar características de la cefalea, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar características de la cefalea, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar características de la cefalea, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'dolor de cabeza intenso',
        severity: 'HIGH' as const,
        description: 'Cefalea intensa puede indicar patología grave.',
        recommendation: 'Evaluar características de la cefalea, considerar derivación urgente.',
        recommendationForPhysician: 'Evaluar características de la cefalea, considerar derivación urgente.',
        recommendationForPhysiotherapist: 'Evaluar características de la cefalea, considerar derivación urgente.',
        soapNote: 'Este síntoma crítico requiere atención médica urgente.'
      },
      {
        keyword: 'náuseas',
        severity: 'MEDIUM' as const,
        description: 'Náuseas pueden indicar múltiples patologías.',
        recommendation: 'Evaluar causa de las náuseas, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar causa de las náuseas, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar causa de las náuseas, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'vómitos',
        severity: 'MEDIUM' as const,
        description: 'Vómitos pueden indicar múltiples patologías.',
        recommendation: 'Evaluar causa de los vómitos, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar causa de los vómitos, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar causa de los vómitos, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'vómitos persistentes',
        severity: 'HIGH' as const,
        description: 'Vómitos persistentes pueden indicar patología grave.',
        recommendation: 'Evaluar causa de los vómitos, considerar derivación médica.',
        recommendationForPhysician: 'Evaluar causa de los vómitos, considerar derivación médica.',
        recommendationForPhysiotherapist: 'Evaluar causa de los vómitos, considerar derivación médica.',
        soapNote: 'Este síntoma crítico requiere atención médica urgente.'
      },
      {
        keyword: 'dolor abdominal',
        severity: 'MEDIUM' as const,
        description: 'Dolor abdominal puede indicar múltiples patologías.',
        recommendation: 'Evaluar características del dolor abdominal, considerar evaluación médica.',
        recommendationForPhysician: 'Evaluar características del dolor abdominal, considerar evaluación médica.',
        recommendationForPhysiotherapist: 'Evaluar características del dolor abdominal, considerar evaluación médica.',
        soapNote: 'Este síntoma puede indicar una posible patología sistémica.'
      },
      {
        keyword: 'dolor abdominal intenso',
        severity: 'HIGH' as const,
        description: 'Dolor abdominal intenso puede indicar patología grave.',
        recommendation: 'Evaluar características del dolor, considerar derivación urgente.',
        recommendationForPhysician: 'Evaluar características del dolor, considerar derivación urgente.',
        recommendationForPhysiotherapist: 'Evaluar características del dolor, considerar derivación urgente.',
        soapNote: 'Este síntoma crítico requiere atención médica urgente.'
      },
      {
        keyword: 'sangrado',
        severity: 'HIGH' as const,
        description: 'Sangrado puede indicar patología grave.',
        recommendation: 'Evaluar origen y características del sangrado, considerar derivación urgente.',
        recommendationForPhysician: 'Evaluar origen y características del sangrado, considerar derivación urgente.',
        recommendationForPhysiotherapist: 'Evaluar origen y características del sangrado, considerar derivación urgente.',
        soapNote: 'Este síntoma crítico requiere atención médica urgente.'
      },
      {
        keyword: 'hemorragia',
        severity: 'CRITICAL' as const,
        description: 'Hemorragia requiere atención médica inmediata.',
        recommendation: 'DERIVACIÓN URGENTE para control de la hemorragia.',
        recommendationForPhysician: 'DERIVACIÓN URGENTE para control de la hemorragia.',
        recommendationForPhysiotherapist: 'DERIVACIÓN URGENTE para control de la hemorragia.',
        soapNote: 'Este síntoma crítico requiere atención médica urgente.'
      },
      {
        keyword: 'convulsiones',
        severity: 'CRITICAL' as const,
        description: 'Convulsiones requieren atención médica inmediata.',
        recommendation: 'DERIVACIÓN URGENTE para evaluación neurológica.',
        recommendationForPhysician: 'DERIVACIÓN URGENTE para evaluación neurológica.',
        recommendationForPhysiotherapist: 'DERIVACIÓN URGENTE para evaluación neurológica.',
        soapNote: 'Este síntoma crítico requiere atención médica urgente.'
      },
      {
        keyword: 'pérdida conciencia',
        severity: 'CRITICAL' as const,
        description: 'Pérdida de conciencia requiere atención médica inmediata.',
        recommendation: 'DERIVACIÓN URGENTE para evaluación médica.',
        recommendationForPhysician: 'DERIVACIÓN URGENTE para evaluación médica.',
        recommendationForPhysiotherapist: 'DERIVACIÓN URGENTE para evaluación médica.',
        soapNote: 'Este síntoma crítico requiere atención médica urgente.'
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

  /**
   * Genera recomendaciones contextuales según el rol del profesional
   */
  private getContextualRecommendation(
    baseRecommendation: string,
    professionalRole: ProfessionalRole,
    entityType: string,
    entityName: string
  ): { recommendation: string; soapNote: string } {
    
    switch (professionalRole) {
      case 'PHYSIOTHERAPIST':
        if (entityType === 'MEDICATION') {
          return {
            recommendation: `⚠️ ALERTA: ${entityName} puede estar contraindicado. Recomendar consulta con médico tratante para evaluación de medicación.`,
            soapNote: `Hallazgo: Posible contraindicación medicamentosa con ${entityName}. Recomendación: Derivar a médico tratante para evaluación.`
          };
        } else if (entityType === 'CRITICAL_SYMPTOM') {
          return {
            recommendation: `🚨 SÍNTOMA CRÍTICO: ${entityName}. Suspender tratamiento y derivar urgentemente a urgencias.`,
            soapNote: `Hallazgo: Síntoma crítico ${entityName} detectado. Acción: Derivación urgente a urgencias.`
          };
        }
        break;
        
      case 'PHYSICIAN':
        if (entityType === 'MEDICATION') {
          return {
            recommendation: `💊 EVALUAR MEDICACIÓN: ${entityName} puede estar contraindicado. Considerar cambio a alternativa terapéutica más segura.`,
            soapNote: `Evaluación: Posible contraindicación con ${entityName}. Plan: Revisar medicación y considerar alternativas.`
          };
        } else if (entityType === 'CRITICAL_SYMPTOM') {
          return {
            recommendation: `🚨 SÍNTOMA CRÍTICO: ${entityName}. Evaluar inmediatamente y considerar derivación urgente según gravedad.`,
            soapNote: `Evaluación: Síntoma crítico ${entityName}. Plan: Evaluación inmediata y derivación si es necesario.`
          };
        }
        break;
        
      case 'NURSE':
        return {
          recommendation: `📋 DOCUMENTAR: ${entityName} requiere atención especial. Registrar en ficha y notificar al médico responsable.`,
          soapNote: `Documentación: ${entityName} detectado. Acción: Notificar al médico responsable.`
        };
        
      default:
        return {
          recommendation: baseRecommendation,
          soapNote: `Hallazgo: ${entityName} detectado. Requiere evaluación profesional.`
        };
    }
    
    return {
      recommendation: baseRecommendation,
      soapNote: `Hallazgo: ${entityName} detectado. Requiere evaluación profesional.`
    };
  }

  /**
   * Obtiene las capacidades profesionales según el rol y contexto geográfico
   */
  private getProfessionalCapabilities(context: ProfessionalContext): ProfessionalCapabilities {
    const baseCapabilities = this.getBaseCapabilitiesByRole(context.role);
    const geographicRestrictions = this.getGeographicRestrictions(context.country, context.state);
    
    // Aplicar restricciones geográficas
    const finalCapabilities = { ...baseCapabilities };
    
    // Ejemplo: Restricciones de punción seca por país
    if (context.country === 'USA') {
      finalCapabilities.canPerformDryNeedling = false;
      finalCapabilities.restrictions.push('Dry needling no permitido en Estados Unidos para fisioterapeutas');
    } else if (context.country === 'CHILE') {
      finalCapabilities.canPerformDryNeedling = true;
      finalCapabilities.restrictions.push('Requiere certificación específica en punción seca');
    }
    
    // Restricciones por estado (ejemplo: California)
    if (context.state === 'CALIFORNIA') {
      finalCapabilities.canPerformAcupuncture = false;
      finalCapabilities.restrictions.push('Acupuntura requiere licencia específica en California');
    }
    
    return finalCapabilities;
  }

  /**
   * Obtiene capacidades base por rol profesional
   */
  private getBaseCapabilitiesByRole(role: ProfessionalRole): ProfessionalCapabilities {
    switch (role) {
      case 'PHYSIOTHERAPIST':
        return {
          canPrescribeMedications: false,
          canOrderExams: false,
          canPerformProcedures: ['manual_therapy', 'exercise_prescription', 'electrotherapy', 'ultrasound'],
          canCreateExercisePrograms: true,
          canPerformManualTherapy: true,
          canPerformAcupuncture: false,
          canPerformDryNeedling: false, // Se ajustará según país
          canPerformInvasiveProcedures: false,
          canReferToSpecialists: true,
          canDischargePatients: true,
          canModifyTreatmentPlans: true,
          restrictions: ['No puede prescribir medicamentos', 'No puede ordenar exámenes']
        };
        
      case 'PHYSICIAN':
        return {
          canPrescribeMedications: true,
          canOrderExams: true,
          canPerformProcedures: ['all_medical_procedures'],
          canCreateExercisePrograms: false,
          canPerformManualTherapy: false,
          canPerformAcupuncture: false,
          canPerformDryNeedling: false,
          canPerformInvasiveProcedures: true,
          canReferToSpecialists: true,
          canDischargePatients: true,
          canModifyTreatmentPlans: true,
          restrictions: ['No puede crear programas de ejercicio específicos', 'Solo recomendaciones generales de ejercicio']
        };
        
      case 'NURSE':
        return {
          canPrescribeMedications: false,
          canOrderExams: false,
          canPerformProcedures: ['basic_care', 'vital_signs', 'medication_administration', 'injections', 'iv_administration'],
          canCreateExercisePrograms: false,
          canPerformManualTherapy: false,
          canPerformAcupuncture: false,
          canPerformDryNeedling: false,
          canPerformInvasiveProcedures: true, // Pueden puncionar para administrar medicamentos
          canReferToSpecialists: false,
          canDischargePatients: false,
          canModifyTreatmentPlans: false,
          restrictions: ['Solo puede administrar medicamentos prescritos', 'No puede modificar tratamientos', 'Debe verificar indicaciones antes de administrar'],
          requiredSupervision: ['PHYSICIAN']
        };
        
      case 'PSYCHOLOGIST':
        return {
          canPrescribeMedications: false,
          canOrderExams: false,
          canPerformProcedures: ['psychological_assessment', 'therapy_sessions'],
          canCreateExercisePrograms: false,
          canPerformManualTherapy: false,
          canPerformAcupuncture: false,
          canPerformDryNeedling: false,
          canPerformInvasiveProcedures: false,
          canReferToSpecialists: true,
          canDischargePatients: true,
          canModifyTreatmentPlans: true,
          restrictions: ['No puede prescribir medicamentos', 'No puede realizar procedimientos físicos']
        };
        
      case 'OCCUPATIONAL_THERAPIST':
        return {
          canPrescribeMedications: false,
          canOrderExams: false,
          canPerformProcedures: ['occupational_assessment', 'adaptive_equipment', 'activity_modification'],
          canCreateExercisePrograms: true,
          canPerformManualTherapy: false,
          canPerformAcupuncture: false,
          canPerformDryNeedling: false,
          canPerformInvasiveProcedures: false,
          canReferToSpecialists: true,
          canDischargePatients: true,
          canModifyTreatmentPlans: true,
          restrictions: ['Enfocado en actividades de la vida diaria', 'No puede realizar terapia manual']
        };
        
      default:
        return {
          canPrescribeMedications: false,
          canOrderExams: false,
          canPerformProcedures: [],
          canCreateExercisePrograms: false,
          canPerformManualTherapy: false,
          canPerformAcupuncture: false,
          canPerformDryNeedling: false,
          canPerformInvasiveProcedures: false,
          canReferToSpecialists: false,
          canDischargePatients: false,
          canModifyTreatmentPlans: false,
          restrictions: ['Rol no reconocido']
        };
    }
  }

  /**
   * Obtiene restricciones geográficas por país y estado
   */
  private getGeographicRestrictions(country: Country, state?: State): GeographicRestrictions {
    const restrictions: GeographicRestrictions = {
      country,
      state,
      restrictions: {}
    };

    // Restricciones por país
    switch (country) {
      case 'CHILE':
        restrictions.restrictions = {
          'dry_needling': {
            allowed: true,
            conditions: ['Certificación específica requerida', 'Formación continua obligatoria'],
            documentationRequired: ['Certificado de formación', 'Registro en Colegio de Kinesiólogos']
          },
          'acupuncture': {
            allowed: false,
            conditions: ['Solo médicos con especialización'],
            supervisionRequired: ['PHYSICIAN']
          },
          'prescription_medication': {
            allowed: false,
            conditions: ['Solo médicos'],
            supervisionRequired: ['PHYSICIAN']
          }
        };
        break;
        
      case 'USA':
        restrictions.restrictions = {
          'dry_needling': {
            allowed: false,
            conditions: ['No permitido para fisioterapeutas'],
            documentationRequired: []
          },
          'acupuncture': {
            allowed: false,
            conditions: ['Requiere licencia específica'],
            supervisionRequired: ['PHYSICIAN']
          },
          'prescription_medication': {
            allowed: false,
            conditions: ['Solo médicos y algunos NPs/PAs'],
            supervisionRequired: ['PHYSICIAN']
          }
        };
        break;
        
      case 'SPAIN':
        restrictions.restrictions = {
          'dry_needling': {
            allowed: true,
            conditions: ['Formación específica requerida'],
            documentationRequired: ['Certificado de formación']
          },
          'acupuncture': {
            allowed: false,
            conditions: ['Solo médicos'],
            supervisionRequired: ['PHYSICIAN']
          }
        };
        break;
    }

    // Restricciones específicas por estado
    if (state) {
      switch (state) {
        case 'CALIFORNIA':
          restrictions.restrictions['acupuncture'] = {
            allowed: false,
            conditions: ['Requiere licencia específica de acupuntura'],
            documentationRequired: ['Licencia de acupuntura']
          };
          break;
          
        case 'TEXAS':
          restrictions.restrictions['dry_needling'] = {
            allowed: false,
            conditions: ['No permitido en Texas'],
            documentationRequired: []
          };
          break;
      }
    }

    return restrictions;
  }

  /**
   * Obtiene las capacidades profesionales para un contexto específico
   */
  public getCapabilitiesForContext(context: ProfessionalContext): ProfessionalCapabilities {
    return this.getProfessionalCapabilities(context);
  }

  /**
   * Verifica si un profesional puede realizar una acción específica
   */
  public canPerformAction(
    action: string,
    context: ProfessionalContext
  ): { allowed: boolean; reason?: string; restrictions?: string[] } {
    const capabilities = this.getCapabilitiesForContext(context);
    
    switch (action) {
      case 'prescribe_medication':
        return {
          allowed: capabilities.canPrescribeMedications,
          reason: capabilities.canPrescribeMedications ? 'Permitido' : 'Solo médicos pueden prescribir medicamentos',
          restrictions: capabilities.restrictions
        };
        
      case 'order_exams':
        return {
          allowed: capabilities.canOrderExams,
          reason: capabilities.canOrderExams ? 'Permitido' : 'Solo médicos pueden ordenar exámenes',
          restrictions: capabilities.restrictions
        };
        
      case 'create_exercise_program':
        return {
          allowed: capabilities.canCreateExercisePrograms,
          reason: capabilities.canCreateExercisePrograms ? 'Permitido' : 'No puede crear programas de ejercicio específicos',
          restrictions: capabilities.restrictions
        };
        
      case 'dry_needling':
        return {
          allowed: capabilities.canPerformDryNeedling,
          reason: capabilities.canPerformDryNeedling ? 'Permitido' : 'No permitido para este profesional en esta ubicación',
          restrictions: capabilities.restrictions
        };
        
      case 'manual_therapy':
        return {
          allowed: capabilities.canPerformManualTherapy,
          reason: capabilities.canPerformManualTherapy ? 'Permitido' : 'No puede realizar terapia manual',
          restrictions: capabilities.restrictions
        };
        
      default:
        return {
          allowed: false,
          reason: 'Acción no reconocida',
          restrictions: ['Acción no definida en el sistema']
        };
    }
  }

  /**
   * Verifica la administración de medicamentos por enfermeros
   */
  public verifyMedicationAdministration(
    administration: MedicationAdministration,
    prescription: MedicationPrescription,
    professionalContext: ProfessionalContext
  ): MedicationVerificationResult {
    const result: MedicationVerificationResult = {
      isCompliant: true,
      discrepancies: [],
      warnings: [],
      recommendations: [],
      severity: 'LOW'
    };

    // Verificar que el profesional sea enfermero
    if (professionalContext.role !== 'NURSE') {
      result.discrepancies.push('Solo enfermeros pueden administrar medicamentos');
      result.severity = 'CRITICAL';
      result.isCompliant = false;
      return result;
    }

    // Verificar que la prescripción esté activa
    if (prescription.status !== 'ACTIVE') {
      result.discrepancies.push(`Prescripción ${prescription.status.toLowerCase()}`);
      result.severity = 'HIGH';
      result.isCompliant = false;
    }

    // Verificar nombre del medicamento
    if (administration.medicationName.toLowerCase() !== prescription.medicationName.toLowerCase()) {
      result.discrepancies.push(`Medicamento administrado (${administration.medicationName}) no coincide con prescrito (${prescription.medicationName})`);
      result.severity = 'CRITICAL';
      result.isCompliant = false;
    }

    // Verificar dosis
    if (administration.dosage !== prescription.dosage) {
      result.discrepancies.push(`Dosis administrada (${administration.dosage}) no coincide con prescrita (${prescription.dosage})`);
      result.severity = 'HIGH';
      result.isCompliant = false;
    }

    // Verificar vía de administración
    if (administration.route !== prescription.route) {
      result.discrepancies.push(`Vía administrada (${administration.route}) no coincide con prescrita (${prescription.route})`);
      result.severity = 'HIGH';
      result.isCompliant = false;
    }

    // Verificar frecuencia (si aplica)
    if (administration.frequency && administration.frequency !== prescription.frequency) {
      result.warnings.push(`Frecuencia administrada (${administration.frequency}) difiere de prescrita (${prescription.frequency})`);
    }

    // Verificar horario de administración
    const adminTime = new Date(administration.administeredAt);
    const prescriptionTime = new Date(prescription.prescribedAt);
    const timeDiff = Math.abs(adminTime.getTime() - prescriptionTime.getTime()) / (1000 * 60 * 60); // horas

    if (timeDiff > 2) { // Más de 2 horas de diferencia
      result.warnings.push(`Administración realizada ${timeDiff.toFixed(1)} horas después de la prescripción`);
    }

    // Generar recomendaciones según el contexto
    if (!result.isCompliant) {
      result.recommendations.push('Suspender administración y notificar al médico responsable');
      result.recommendations.push('Documentar incidente en ficha del paciente');
    } else if (result.warnings.length > 0) {
      result.recommendations.push('Verificar con el médico responsable antes de continuar');
      result.recommendations.push('Documentar justificación de la variación');
    } else {
      result.recommendations.push('Administración correcta, documentar en ficha');
    }

    return result;
  }

  /**
   * Verifica múltiples administraciones de medicamentos
   */
  public verifyMultipleMedicationAdministrations(
    administrations: MedicationAdministration[],
    prescriptions: MedicationPrescription[],
    professionalContext: ProfessionalContext
  ): MedicationVerificationResult[] {
    return administrations.map(admin => {
      const prescription = prescriptions.find(p => 
        p.id === admin.prescriptionId || 
        p.medicationName.toLowerCase() === admin.medicationName.toLowerCase()
      );
      
      if (!prescription) {
        return {
          isCompliant: false,
          discrepancies: [`No se encontró prescripción para ${admin.medicationName}`],
          warnings: [],
          recommendations: ['Suspender administración y notificar al médico'],
          severity: 'CRITICAL' as const
        };
      }
      
      return this.verifyMedicationAdministration(admin, prescription, professionalContext);
    });
  }

  /**
   * Genera alertas de medicamentos pendientes
   */
  public generateMedicationAlerts(
    prescriptions: MedicationPrescription[],
    administrations: MedicationAdministration[]
  ): RedFlag[] {
    const alerts: RedFlag[] = [];
    
    prescriptions.forEach(prescription => {
      if (prescription.status !== 'ACTIVE') return;
      
      const recentAdministrations = administrations.filter(admin => 
        admin.medicationName.toLowerCase() === prescription.medicationName.toLowerCase() &&
        admin.status === 'ADMINISTERED' &&
        new Date(admin.administeredAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
      );
      
      // Verificar si falta administración según frecuencia
      const shouldHaveBeenAdministered = this.shouldMedicationBeAdministered(prescription, recentAdministrations);
      
      if (shouldHaveBeenAdministered) {
        alerts.push({
          id: `med-alert-${Date.now()}-${Math.random()}`,
          type: 'DOSAGE_WARNING',
          severity: 'MEDIUM',
          title: `⚠️ Medicamento pendiente: ${prescription.medicationName}`,
          description: `El medicamento ${prescription.medicationName} debería haber sido administrado según la prescripción`,
          recommendation: 'Verificar administración y documentar en ficha',
          soapNote: `Alerta: Medicamento ${prescription.medicationName} pendiente de administración`,
          relatedEntities: [prescription.medicationName],
          confidence: 0.9,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return alerts;
  }

  /**
   * Determina si un medicamento debería haber sido administrado
   */
  private shouldMedicationBeAdministered(
    prescription: MedicationPrescription,
    recentAdministrations: MedicationAdministration[]
  ): boolean {
    // Lógica simplificada - se puede expandir según necesidades específicas
    const frequency = prescription.frequency.toLowerCase();
    
    if (frequency.includes('cada 8 horas') || frequency.includes('8h')) {
      return recentAdministrations.length < 3;
    } else if (frequency.includes('cada 12 horas') || frequency.includes('12h')) {
      return recentAdministrations.length < 2;
    } else if (frequency.includes('diario') || frequency.includes('1 vez al día')) {
      return recentAdministrations.length < 1;
    }
    
    return false;
  }

  /**
   * Filtra indicaciones médicas según el rol profesional y genera advertencias
   */
  public filterMedicalIndications(
    indications: MedicalIndication[],
    patient: Patient,
    professionalContext: ProfessionalContext
  ): {
    relevantIndications: MedicalIndication[];
    warnings: IndicationWarning[];
    treatmentGuidelines: TreatmentGuideline[];
  } {
    const relevantIndications: MedicalIndication[] = [];
    const warnings: IndicationWarning[] = [];
    const treatmentGuidelines: TreatmentGuideline[] = [];

    // Filtrar indicaciones según rol
    indications.forEach(indication => {
      const isRelevant = this.isIndicationRelevantForRole(indication, professionalContext);
      if (isRelevant) {
        relevantIndications.push(indication);
        
        // Generar advertencias específicas
        const indicationWarnings = this.generateIndicationWarnings(indication, patient, professionalContext);
        warnings.push(...indicationWarnings);
      }
    });

    // Obtener guías de tratamiento relevantes
    const guidelines = this.getTreatmentGuidelines(patient.condition, professionalContext);
    treatmentGuidelines.push(...guidelines);

    return {
      relevantIndications,
      warnings,
      treatmentGuidelines
    };
  }

  /**
   * Determina si una indicación es relevante para el rol profesional
   */
  private isIndicationRelevantForRole(indication: MedicalIndication, context: ProfessionalContext): boolean {
    switch (context.role) {
      case 'PHYSIOTHERAPIST':
        return ['TREATMENT_PLAN', 'EXERCISE_PROGRAM', 'PROCEDURE'].includes(indication.type);
        
      case 'NURSE':
        return ['MEDICATION', 'PROCEDURE'].includes(indication.type);
        
      case 'PHYSICIAN':
        return true; // Los médicos ven todas las indicaciones
        
      case 'PSYCHOLOGIST':
        return ['TREATMENT_PLAN', 'REFERRAL'].includes(indication.type);
        
      case 'OCCUPATIONAL_THERAPIST':
        return ['TREATMENT_PLAN', 'EXERCISE_PROGRAM'].includes(indication.type);
        
      default:
        return false;
    }
  }

  /**
   * Genera advertencias específicas para una indicación
   */
  private generateIndicationWarnings(
    indication: MedicalIndication,
    patient: Patient,
    context: ProfessionalContext
  ): IndicationWarning[] {
    const warnings: IndicationWarning[] = [];

    // Verificar interacciones medicamentosas
    if (indication.type === 'MEDICATION' && patient.medications.length > 0) {
      const interactionWarnings = this.checkMedicationInteractions(indication, patient.medications);
      warnings.push(...interactionWarnings);
    }

    // Verificar contraindicaciones
    if (indication.contraindications && indication.contraindications.length > 0) {
      const contraindicationWarnings = this.checkContraindications(indication, patient);
      warnings.push(...contraindicationWarnings);
    }

    // Verificar puntos ciegos según rol
    const blindSpotWarnings = this.checkBlindSpots(indication, context);
    warnings.push(...blindSpotWarnings);

    // Verificar riesgos legales
    const legalRiskWarnings = this.checkLegalRisks(indication, context);
    warnings.push(...legalRiskWarnings);

    return warnings;
  }

  /**
   * Verifica interacciones medicamentosas
   */
  private checkMedicationInteractions(indication: MedicalIndication, currentMedications: string[]): IndicationWarning[] {
    const warnings: IndicationWarning[] = [];
    
    // Simulación de verificación de interacciones
    const knownInteractions = this.getKnownDrugInteractions();
    
    currentMedications.forEach(med => {
      const interactions = knownInteractions.filter(i => 
        i.medications.includes(med.toLowerCase()) && 
        i.medications.includes(indication.title.toLowerCase())
      );
      
      interactions.forEach(interaction => {
        warnings.push({
          id: `interaction-${Date.now()}-${Math.random()}`,
          type: 'INTERACTION',
          severity: interaction.severity,
          title: `⚠️ Interacción Medicamentosa: ${indication.title} + ${med}`,
          description: interaction.description,
          recommendation: interaction.recommendation,
          evidenceLevel: interaction.evidenceLevel,
          isDismissible: true,
          requiresAcknowledgment: true,
          timestamp: new Date().toISOString()
        });
      });
    });
    
    return warnings;
  }

  /**
   * Verifica contraindicaciones
   */
  private checkContraindications(indication: MedicalIndication, patient: Patient): IndicationWarning[] {
    const warnings: IndicationWarning[] = [];
    
    indication.contraindications?.forEach(contraindication => {
      if (patient.clinicalHistory.toLowerCase().includes(contraindication.toLowerCase()) ||
          patient.condition.toLowerCase().includes(contraindication.toLowerCase())) {
        warnings.push({
          id: `contraindication-${Date.now()}-${Math.random()}`,
          type: 'CONTRAINDICATION',
          severity: 'HIGH',
          title: `🚨 Contraindicación Detectada: ${indication.title}`,
          description: `El paciente presenta ${contraindication} que contraindica ${indication.title}`,
          recommendation: 'Revisar indicación y considerar alternativas',
          isDismissible: false,
          requiresAcknowledgment: true,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return warnings;
  }

  /**
   * Verifica puntos ciegos según el rol profesional
   */
  private checkBlindSpots(indication: MedicalIndication, context: ProfessionalContext): IndicationWarning[] {
    const warnings: IndicationWarning[] = [];
    
    switch (context.role) {
      case 'PHYSIOTHERAPIST':
        if (indication.type === 'MEDICATION') {
          warnings.push({
            id: `blindspot-${Date.now()}-${Math.random()}`,
            type: 'BLIND_SPOT',
            severity: 'MEDIUM',
            title: '👁️ Punto Ciego: Indicación Medicamentosa',
            description: 'Como fisioterapeuta, no puedes prescribir medicamentos. Verificar que la indicación sea del médico.',
            recommendation: 'Confirmar que la indicación proviene del médico tratante',
            professionalContext: ['PHYSIOTHERAPIST'],
            isDismissible: true,
            requiresAcknowledgment: false,
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      case 'NURSE':
        if (indication.type === 'EXAM') {
          warnings.push({
            id: `blindspot-${Date.now()}-${Math.random()}`,
            type: 'BLIND_SPOT',
            severity: 'MEDIUM',
            title: '👁️ Punto Ciego: Orden de Examen',
            description: 'Como enfermero, no puedes ordenar exámenes. Verificar que la orden sea del médico.',
            recommendation: 'Confirmar que la orden proviene del médico responsable',
            professionalContext: ['NURSE'],
            isDismissible: true,
            requiresAcknowledgment: false,
            timestamp: new Date().toISOString()
          });
        }
        break;
    }
    
    return warnings;
  }

  /**
   * Verifica riesgos legales
   */
  private checkLegalRisks(indication: MedicalIndication, context: ProfessionalContext): IndicationWarning[] {
    const warnings: IndicationWarning[] = [];
    
    // Verificar si la indicación está dentro del alcance del profesional
    const capabilities = this.getCapabilitiesForContext(context);
    
    if (indication.type === 'MEDICATION' && !capabilities.canPrescribeMedications) {
      warnings.push({
        id: `legal-${Date.now()}-${Math.random()}`,
        type: 'LEGAL_RISK',
        severity: 'CRITICAL',
        title: '⚖️ Riesgo Legal: Prescripción de Medicamentos',
        description: 'Prescribir medicamentos sin autorización puede tener consecuencias legales graves',
        recommendation: 'Solo administrar medicamentos con prescripción médica válida',
        legalImplications: ['Ejercicio ilegal de la medicina', 'Responsabilidad civil', 'Sanciones profesionales'],
        professionalContext: [context.role],
        isDismissible: false,
        requiresAcknowledgment: true,
        timestamp: new Date().toISOString()
      });
    }
    
    return warnings;
  }

  /**
   * Obtiene guías de tratamiento basadas en evidencia
   */
  private getTreatmentGuidelines(condition: string, context: ProfessionalContext): TreatmentGuideline[] {
    const guidelines = this.getTreatmentGuidelinesDatabase();
    
    return guidelines.filter(guideline => 
      guideline.condition.toLowerCase().includes(condition.toLowerCase()) &&
      guideline.professionalRoles.includes(context.role) &&
      guideline.country === context.country
    );
  }

  /**
   * Base de datos de interacciones medicamentosas conocidas
   */
  private getKnownDrugInteractions() {
    return [
      {
        medications: ['warfarin', 'aspirin'],
        description: 'Aumenta riesgo de hemorragia',
        recommendation: 'Monitorizar INR y signos de sangrado',
        severity: 'HIGH' as const,
        evidenceLevel: 'A' as const
      },
      {
        medications: ['ibuprofeno', 'lithium'],
        description: 'Puede aumentar niveles de litio',
        recommendation: 'Monitorizar niveles de litio',
        severity: 'MEDIUM' as const,
        evidenceLevel: 'B' as const
      }
    ];
  }

  /**
   * Base de datos de guías de tratamiento
   */
  private getTreatmentGuidelinesDatabase(): TreatmentGuideline[] {
    return [
      {
        id: 'guideline-1',
        condition: 'dolor lumbar',
        title: 'Guía de Tratamiento para Dolor Lumbar',
        description: 'Protocolo basado en evidencia para manejo de dolor lumbar',
        evidenceLevel: 'A',
        recommendations: [
          'Ejercicios de estabilización lumbar',
          'Educación del paciente',
          'Terapia manual específica',
          'Progresión gradual de actividad'
        ],
        contraindications: [
          'Síndrome de cauda equina',
          'Fracturas vertebrales',
          'Infección activa'
        ],
        professionalRoles: ['PHYSIOTHERAPIST', 'PHYSICIAN'],
        country: 'CHILE',
        source: 'Colegio de Kinesiólogos de Chile',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'guideline-2',
        condition: 'dolor cervical',
        title: 'Guía de Tratamiento para Dolor Cervical',
        description: 'Protocolo basado en evidencia para manejo de dolor cervical',
        evidenceLevel: 'B',
        recommendations: [
          'Ejercicios de movilidad cervical',
          'Técnicas de relajación',
          'Educación postural',
          'Terapia manual conservadora'
        ],
        contraindications: [
          'Compresión medular',
          'Fracturas cervicales',
          'Inestabilidad vertebral'
        ],
        professionalRoles: ['PHYSIOTHERAPIST', 'PHYSICIAN'],
        country: 'CHILE',
        source: 'Colegio de Kinesiólogos de Chile',
        lastUpdated: '2024-01-15'
      }
    ];
  }
}

// === EXPORTACIÓN DE LA CLASE ===
export { ClinicalAssistantService };

// === INSTANCIA SINGLETON ===
export const clinicalAssistantService = new ClinicalAssistantService();
export default clinicalAssistantService;
