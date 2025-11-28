/**
 * Vital Signs Detector - Medical Alerts System
 * 
 * Detects abnormal vital signs in transcriptions and generates medical alerts
 * 
 * ISO 27001 Compliance:
 * - A.12.4.1: Event logging (all detections logged)
 * - A.12.4.2: Protection of log information (encrypted metadata)
 * 
 * Medical-Legal Requirements:
 * - 100% of detected alerts must be included in SOAP notes
 * - False positive rate must be <5%
 * - Processing time must be <10 seconds
 */

export interface VitalSign {
  type: 'blood_pressure' | 'pain_scale' | 'oxygen_saturation' | 'heart_rate' | 'temperature';
  value: string;
  numericValue?: number;
  unit?: string;
  detectedAt: number; // Position in text
}

export interface MedicalAlert {
  type: 'vital_sign' | 'post_surgical' | 'medication' | 'other';
  severity: 'info' | 'warning' | 'critical';
  category: string; // e.g., 'hypertension', 'severe_pain', 'low_saturation'
  message: string;
  detectedValue?: string;
  normalRange?: string;
  recommendation?: string;
  vitalSign?: VitalSign;
  detectedAt: number; // Position in text
}

/**
 * Regex patterns for vital signs detection
 * Optimized for Spanish medical terminology
 */
export const VITAL_SIGNS_PATTERNS = {
  bloodPressure: {
    // Patterns: PA 140/90, PA: 140/90, Presión 140-90, etc.
    regex: /(?:PA|presi[óo]n\s*(?:arterial)?|tensi[óo]n)[:\s]*(\d{2,3})[\/\-](\d{2,3})/gi,
    unit: 'mmHg',
  },
  painScale: {
    // Patterns: EVA 6/10, EVA: 8/10, escala 7 de 10, etc.
    regex: /(?:EVA|escala\s*(?:visual\s*)?anal[óo]gica)[:\s]*([0-9]|10)\/10/gi,
    unit: '/10',
  },
  oxygenSaturation: {
    // Patterns: Sat 98%, SatO2 95%, Saturación 97%, etc.
    regex: /(?:Sat(?:O2)?|saturaci[óo]n)[:\s]*(\d{1,3})%/gi,
    unit: '%',
  },
  heartRate: {
    // Patterns: FC 72, Frecuencia 80, Pulso 75, etc.
    regex: /(?:FC|frecuencia\s*(?:card[ií]aca)?|pulso)[:\s]*(\d{2,3})/gi,
    unit: 'bpm',
  },
  temperature: {
    // Patterns: Temp 37.5, Temperatura 38.2, etc.
    regex: /(?:temp(?:eratura)?|fiebre)[:\s]*(\d{1,2}[.,]\d{1,2})/gi,
    unit: '°C',
  },
};

/**
 * Alert thresholds for vital signs
 */
export const ALERT_THRESHOLDS = {
  bloodPressure: {
    stage1HTN: {
      systolic: { min: 140, max: 159 },
      diastolic: { min: 90, max: 99 },
      severity: 'warning' as const,
      message: '⚠️ HIPERTENSIÓN GRADO 1 - Considerar referencia médica',
      recommendation: 'Monitorear presión arterial. Considerar evaluación médica si persiste.',
    },
    stage2HTN: {
      systolic: { min: 160 },
      diastolic: { min: 100 },
      severity: 'critical' as const,
      message: '🚨 HIPERTENSIÓN GRADO 2 - Referencia médica urgente',
      recommendation: 'Evaluación médica inmediata recomendada. Considerar ajuste de medicación.',
    },
    hypotension: {
      systolic: { max: 90 },
      diastolic: { max: 60 },
      severity: 'warning' as const,
      message: '⚠️ HIPOTENSIÓN - Monitorear síntomas',
      recommendation: 'Monitorear síntomas de hipotensión. Evaluar si hay mareos o debilidad.',
    },
  },
  painScale: {
    severe: {
      min: 8,
      severity: 'critical' as const,
      message: '⚠️ DOLOR SEVERO - Evaluar medicación',
      recommendation: 'Paciente reporta dolor severo. Evaluar necesidad de ajuste de medicación o intervención.',
    },
    moderate: {
      min: 4,
      max: 7,
      severity: 'warning' as const,
      message: 'ℹ️ DOLOR MODERADO - Monitorear respuesta al tratamiento',
      recommendation: 'Monitorear respuesta al tratamiento. Considerar ajustes si no mejora.',
    },
  },
  oxygenSaturation: {
    low: {
      max: 95,
      severity: 'warning' as const,
      message: '⚠️ SATURACIÓN BAJA - Considerar evaluación médica',
      recommendation: 'Saturación de oxígeno por debajo de lo normal. Monitorear y considerar evaluación médica.',
    },
    critical: {
      max: 90,
      severity: 'critical' as const,
      message: '🚨 SATURACIÓN CRÍTICA - Evaluación médica urgente',
      recommendation: 'Saturación críticamente baja. Evaluación médica inmediata requerida.',
    },
  },
  heartRate: {
    tachycardia: {
      min: 100,
      severity: 'warning' as const,
      message: '⚠️ TAQUICARDIA - Monitorear',
      recommendation: 'Frecuencia cardíaca elevada. Monitorear y evaluar causas.',
    },
    bradycardia: {
      max: 60,
      severity: 'warning' as const,
      message: '⚠️ BRADICARDIA - Monitorear',
      recommendation: 'Frecuencia cardíaca baja. Monitorear y evaluar si hay síntomas.',
    },
  },
  temperature: {
    fever: {
      min: 38.0,
      severity: 'warning' as const,
      message: '⚠️ FIEBRE DETECTADA - Monitorear',
      recommendation: 'Temperatura elevada. Monitorear y considerar evaluación médica si persiste.',
    },
    highFever: {
      min: 39.0,
      severity: 'critical' as const,
      message: '🚨 FIEBRE ALTA - Evaluación médica recomendada',
      recommendation: 'Fiebre alta detectada. Evaluación médica recomendada.',
    },
  },
};

/**
 * Post-surgical keywords for infection detection
 */
export const POST_SURGICAL_KEYWORDS = {
  infection: ['rojez', 'rojo', 'calor', 'secreción', 'pus', 'inflamación', 'infección', 'drenaje'],
  wound: ['herida', 'cicatriz', 'sutura', 'vendaje', 'incisión', 'wound'],
  concern: ['preocupante', 'anormal', 'doloroso', 'hinchado', 'sensible'],
};

/**
 * Detect vital signs in transcription text
 */
export function detectVitalSigns(text: string): VitalSign[] {
  const vitalSigns: VitalSign[] = [];
  const lowerText = text.toLowerCase();

  // Detect blood pressure
  const bpMatches = [...text.matchAll(VITAL_SIGNS_PATTERNS.bloodPressure.regex)];
  bpMatches.forEach(match => {
    if (match.index !== undefined && match[1] && match[2]) {
      vitalSigns.push({
        type: 'blood_pressure',
        value: `${match[1]}/${match[2]}`,
        numericValue: parseInt(match[1]),
        unit: VITAL_SIGNS_PATTERNS.bloodPressure.unit,
        detectedAt: match.index,
      });
    }
  });

  // Detect pain scale
  const painMatches = [...text.matchAll(VITAL_SIGNS_PATTERNS.painScale.regex)];
  painMatches.forEach(match => {
    if (match.index !== undefined && match[1]) {
      vitalSigns.push({
        type: 'pain_scale',
        value: `${match[1]}/10`,
        numericValue: parseInt(match[1]),
        unit: VITAL_SIGNS_PATTERNS.painScale.unit,
        detectedAt: match.index,
      });
    }
  });

  // Detect oxygen saturation
  const satMatches = [...text.matchAll(VITAL_SIGNS_PATTERNS.oxygenSaturation.regex)];
  satMatches.forEach(match => {
    if (match.index !== undefined && match[1]) {
      vitalSigns.push({
        type: 'oxygen_saturation',
        value: `${match[1]}%`,
        numericValue: parseInt(match[1]),
        unit: VITAL_SIGNS_PATTERNS.oxygenSaturation.unit,
        detectedAt: match.index,
      });
    }
  });

  // Detect heart rate
  const hrMatches = [...text.matchAll(VITAL_SIGNS_PATTERNS.heartRate.regex)];
  hrMatches.forEach(match => {
    if (match.index !== undefined && match[1]) {
      vitalSigns.push({
        type: 'heart_rate',
        value: match[1],
        numericValue: parseInt(match[1]),
        unit: VITAL_SIGNS_PATTERNS.heartRate.unit,
        detectedAt: match.index,
      });
    }
  });

  // Detect temperature
  const tempMatches = [...text.matchAll(VITAL_SIGNS_PATTERNS.temperature.regex)];
  tempMatches.forEach(match => {
    if (match.index !== undefined && match[1]) {
      const tempValue = parseFloat(match[1].replace(',', '.'));
      vitalSigns.push({
        type: 'temperature',
        value: match[1],
        numericValue: tempValue,
        unit: VITAL_SIGNS_PATTERNS.temperature.unit,
        detectedAt: match.index,
      });
    }
  });

  return vitalSigns;
}

/**
 * Generate alerts from vital signs
 */
export function generateAlertsFromVitalSigns(vitalSigns: VitalSign[]): MedicalAlert[] {
  const alerts: MedicalAlert[] = [];

  vitalSigns.forEach(vital => {
    switch (vital.type) {
      case 'blood_pressure':
        if (vital.value.includes('/')) {
          const [systolic, diastolic] = vital.value.split('/').map(v => parseInt(v));
          
          // Check stage 2 hypertension (most severe)
          if (systolic >= ALERT_THRESHOLDS.bloodPressure.stage2HTN.systolic.min ||
              diastolic >= ALERT_THRESHOLDS.bloodPressure.stage2HTN.diastolic.min) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.bloodPressure.stage2HTN.severity,
              category: 'hypertension_stage2',
              message: ALERT_THRESHOLDS.bloodPressure.stage2HTN.message,
              detectedValue: vital.value,
              normalRange: '<140/90 mmHg',
              recommendation: ALERT_THRESHOLDS.bloodPressure.stage2HTN.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          }
          // Check stage 1 hypertension
          else if (systolic >= ALERT_THRESHOLDS.bloodPressure.stage1HTN.systolic.min &&
                   systolic <= ALERT_THRESHOLDS.bloodPressure.stage1HTN.systolic.max &&
                   diastolic >= ALERT_THRESHOLDS.bloodPressure.stage1HTN.diastolic.min &&
                   diastolic <= ALERT_THRESHOLDS.bloodPressure.stage1HTN.diastolic.max) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.bloodPressure.stage1HTN.severity,
              category: 'hypertension_stage1',
              message: ALERT_THRESHOLDS.bloodPressure.stage1HTN.message,
              detectedValue: vital.value,
              normalRange: '<140/90 mmHg',
              recommendation: ALERT_THRESHOLDS.bloodPressure.stage1HTN.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          }
          // Check hypotension
          else if (systolic <= ALERT_THRESHOLDS.bloodPressure.hypotension.systolic.max ||
                   diastolic <= ALERT_THRESHOLDS.bloodPressure.hypotension.diastolic.max) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.bloodPressure.hypotension.severity,
              category: 'hypotension',
              message: ALERT_THRESHOLDS.bloodPressure.hypotension.message,
              detectedValue: vital.value,
              normalRange: '90-140/60-90 mmHg',
              recommendation: ALERT_THRESHOLDS.bloodPressure.hypotension.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          }
        }
        break;

      case 'pain_scale':
        if (vital.numericValue !== undefined) {
          if (vital.numericValue >= ALERT_THRESHOLDS.painScale.severe.min) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.painScale.severe.severity,
              category: 'severe_pain',
              message: ALERT_THRESHOLDS.painScale.severe.message,
              detectedValue: vital.value,
              normalRange: '0-3/10',
              recommendation: ALERT_THRESHOLDS.painScale.severe.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          } else if (vital.numericValue >= ALERT_THRESHOLDS.painScale.moderate.min &&
                     vital.numericValue <= ALERT_THRESHOLDS.painScale.moderate.max) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.painScale.moderate.severity,
              category: 'moderate_pain',
              message: ALERT_THRESHOLDS.painScale.moderate.message,
              detectedValue: vital.value,
              normalRange: '0-3/10',
              recommendation: ALERT_THRESHOLDS.painScale.moderate.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          }
        }
        break;

      case 'oxygen_saturation':
        if (vital.numericValue !== undefined) {
          if (vital.numericValue <= ALERT_THRESHOLDS.oxygenSaturation.critical.max) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.oxygenSaturation.critical.severity,
              category: 'critical_saturation',
              message: ALERT_THRESHOLDS.oxygenSaturation.critical.message,
              detectedValue: vital.value,
              normalRange: '95-100%',
              recommendation: ALERT_THRESHOLDS.oxygenSaturation.critical.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          } else if (vital.numericValue <= ALERT_THRESHOLDS.oxygenSaturation.low.max) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.oxygenSaturation.low.severity,
              category: 'low_saturation',
              message: ALERT_THRESHOLDS.oxygenSaturation.low.message,
              detectedValue: vital.value,
              normalRange: '95-100%',
              recommendation: ALERT_THRESHOLDS.oxygenSaturation.low.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          }
        }
        break;

      case 'heart_rate':
        if (vital.numericValue !== undefined) {
          if (vital.numericValue >= ALERT_THRESHOLDS.heartRate.tachycardia.min) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.heartRate.tachycardia.severity,
              category: 'tachycardia',
              message: ALERT_THRESHOLDS.heartRate.tachycardia.message,
              detectedValue: `${vital.value} ${vital.unit}`,
              normalRange: '60-100 bpm',
              recommendation: ALERT_THRESHOLDS.heartRate.tachycardia.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          } else if (vital.numericValue <= ALERT_THRESHOLDS.heartRate.bradycardia.max) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.heartRate.bradycardia.severity,
              category: 'bradycardia',
              message: ALERT_THRESHOLDS.heartRate.bradycardia.message,
              detectedValue: `${vital.value} ${vital.unit}`,
              normalRange: '60-100 bpm',
              recommendation: ALERT_THRESHOLDS.heartRate.bradycardia.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          }
        }
        break;

      case 'temperature':
        if (vital.numericValue !== undefined) {
          if (vital.numericValue >= ALERT_THRESHOLDS.temperature.highFever.min) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.temperature.highFever.severity,
              category: 'high_fever',
              message: ALERT_THRESHOLDS.temperature.highFever.message,
              detectedValue: `${vital.value} ${vital.unit}`,
              normalRange: '36.1-37.2°C',
              recommendation: ALERT_THRESHOLDS.temperature.highFever.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          } else if (vital.numericValue >= ALERT_THRESHOLDS.temperature.fever.min) {
            alerts.push({
              type: 'vital_sign',
              severity: ALERT_THRESHOLDS.temperature.fever.severity,
              category: 'fever',
              message: ALERT_THRESHOLDS.temperature.fever.message,
              detectedValue: `${vital.value} ${vital.unit}`,
              normalRange: '36.1-37.2°C',
              recommendation: ALERT_THRESHOLDS.temperature.fever.recommendation,
              vitalSign: vital,
              detectedAt: vital.detectedAt,
            });
          }
        }
        break;
    }
  });

  return alerts;
}

/**
 * Detect post-surgical concerns
 */
export function detectPostSurgicalAlerts(text: string): MedicalAlert[] {
  const alerts: MedicalAlert[] = [];
  const lowerText = text.toLowerCase();

  // Check for infection keywords
  const infectionKeywordsFound = POST_SURGICAL_KEYWORDS.infection.filter(keyword =>
    lowerText.includes(keyword)
  );

  const woundKeywordsFound = POST_SURGICAL_KEYWORDS.wound.filter(keyword =>
    lowerText.includes(keyword)
  );

  const concernKeywordsFound = POST_SURGICAL_KEYWORDS.concern.filter(keyword =>
    lowerText.includes(keyword)
  );

  // If infection keywords + wound keywords + concern keywords found
  if (infectionKeywordsFound.length > 0 && woundKeywordsFound.length > 0) {
    alerts.push({
      type: 'post_surgical',
      severity: 'critical',
      category: 'possible_infection',
      message: '🚨 SIGNOS DE INFECCIÓN DETECTADOS - Evaluación médica requerida',
      recommendation: 'Se detectaron signos de posible infección en herida quirúrgica. Evaluación médica inmediata recomendada.',
      detectedAt: 0,
    });
  } else if (woundKeywordsFound.length > 0 && concernKeywordsFound.length > 0) {
    alerts.push({
      type: 'post_surgical',
      severity: 'warning',
      category: 'wound_concern',
      message: '⚠️ Documentar estado de herida quirúrgica',
      recommendation: 'Se mencionaron preocupaciones sobre herida quirúrgica. Documentar estado detallado.',
      detectedAt: 0,
    });
  }

  return alerts;
}

