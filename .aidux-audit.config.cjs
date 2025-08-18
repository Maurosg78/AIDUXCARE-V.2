// 🏥 CONFIGURACIÓN ESPECIALIZADA PARA APLICACIONES MÉDICAS
// Archivo: .aidux-audit.config.js

module.exports = {
  projectType: 'medical',
  complianceLevel: 'enterprise',
  preservePatterns: ['hipaa', 'gdpr', 'safety', 'medical', 'clinical'],
  criticalFiles: [
    'src/services/SafetyMonitoringService.ts',
    'src/hooks/useSafetySystem.ts',
    'src/types/medicalSafety.ts',
    'src/features/safety/SafetyMonitorPanel.tsx'
  ],
  specialRules: {
    neverQuarantine: ['safety', 'medical', 'clinical', 'hipaa', 'gdpr'],
    requiresApproval: ['core', 'auth', 'firebase']
  },
  quarantine: {
    backup: true,
    encrypted: true,
    retention: '7years'
  },
  integrityTests: {
    securityRoutes: ['/safety-monitoring', '/medical-dashboard'],
    medicalFunctions: ['SafetyMonitoringService', 'useSafetySystem'],
    complianceChecks: ['HIPAA', 'GDPR', 'FDA']
  },
  metrics: {
    healthcareSpecific: true,
    strictThresholds: true,
    medicalCompliance: true
  },
  notifications: {
    medicalAlerts: true,
    complianceBreaches: true,
    securityIncidents: true
  },
  schedules: {
    dailyAudit: '03:00',
    weeklyReport: 'monday 09:00',
    monthlyCompliance: 'first monday'
  },
  integration: {
    preCommit: 'audit:safety-check',
    prePush: 'compliance:check',
    postMerge: 'audit:medical'
  },
  projectStructure: {
    medicalComponents: 'src/features/safety/',
    auditServices: 'src/services/',
    medicalTypes: 'src/types/',
    complianceHooks: 'src/hooks/'
  }
};

// Exportar también configuración por defecto para desarrollo
module.exports.development = {
  ...module.exports,
  dryRun: true,
  verbose: true,
  skipBackup: false // Siempre hacer backup en medicina
};

// Configuración para producción
module.exports.production = {
  ...module.exports,
  dryRun: false,
  verbose: false,
  skipBackup: false,
  notifications: {
    ...module.exports.notifications,
    critical: 'immediate',
    all: 'immediate' // En producción médica, todo es crítico
  }
}; 