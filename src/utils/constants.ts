/**
 * @fileoverview Constantes enterprise para el wizard de registro
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import { I18nTexts, WizardConfig, TestIds } from '@/types/wizard';

// --- Configuración del wizard ---
export const WIZARD_CONFIG: WizardConfig = {
  enableAnalytics: true,
  enableAccessibility: true,
  enableInternationalization: true,
  enablePasswordStrength: true,
  enableAutoSave: true,
  maxRetries: 3,
  validationDelay: 300,
  autoAdvanceDelay: 2000
};

// --- Textos para internacionalización ---
export const I18N_TEXTS: I18nTexts = {
  title: 'Bienvenido a AiDuxCare',
  description: 'Asistente clínico impulsado por IA. Pensado para que dediques más tiempo a tus pacientes, menos a la gestión.',
  tabs: {
    login: 'Iniciar sesión',
    register: 'Registrarse'
  },
  steps: [
    {
      title: 'Datos personales',
      description: 'Introduce tus datos básicos para comenzar el registro.'
    },
    {
      title: 'Datos profesionales',
      description: 'Información sobre tu práctica médica.'
    },
    {
      title: 'Ubicación y Consentimiento',
      description: 'Información legal y consentimiento para el uso de tus datos.'
    }
  ],
  fields: {
    firstName: 'Nombre',
    lastName: 'Apellido',
    birthDate: 'Fecha de nacimiento',
    email: 'Email',
    phone: 'Teléfono',
    gender: 'Género',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    specialty: 'Especialidad',
    licenseNumber: 'Número de Licencia/Colegiado',
    workplace: 'Centro de Trabajo',
    university: 'Universidad/Institución',
    professionalTitle: 'Título Profesional',
    experienceYears: 'Años de Experiencia',
    country: 'País',
    province: 'Provincia/Estado',
    city: 'Ciudad',
    consentGDPR: 'Consentimiento GDPR',
    consentHIPAA: 'Consentimiento HIPAA'
  },
  errors: {
    required: 'Este campo es obligatorio',
    invalidEmail: 'Email inválido',
    invalidPhone: 'Teléfono inválido',
    passwordMismatch: 'Las contraseñas no coinciden',
    passwordTooShort: 'Mínimo 8 caracteres',
    passwordTooWeak: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales',
    invalidLicense: 'Número de licencia inválido',
    invalidExperience: 'Años de experiencia inválidos',
    consentRequired: 'Debes aceptar ambos consentimientos'
  },
  consent: {
    gdpr: 'He leído y acepto el consentimiento informado y la política de privacidad según GDPR.',
    hipaa: 'Acepto el manejo seguro de información médica según HIPAA.',
    required: 'Debes aceptar ambos consentimientos para completar el registro.'
  },
  buttons: {
    next: 'Siguiente',
    previous: 'Anterior',
    submit: 'Completar Registro',
    loading: 'Registrando...'
  },
  copyright: '© 2025 AiDuxCare. Software médico de nivel hospitalario. Cumple HIPAA/GDPR/XAI.'
};

// --- Test IDs para testing ---
export const TEST_IDS: TestIds = {
  wizardContainer: 'wizard-container',
  wizardProgressBar: 'wizard-progress-bar',
  wizardTabs: 'wizard-tabs',
  formField: (name) => `form-field-${name}`,
  consentCheckbox: (name) => `consent-checkbox-${name}`,
  stepContent: (step) => `step-content-${step}`,
  navigationButton: (direction) => `navigation-button-${direction}`,
  submitButton: 'submit-button'
};

// --- Configuración de validación ---
export const VALIDATION_RULES = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    required: true,
    pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },
  licenseNumber: {
    required: true,
    pattern: /^[A-Z0-9]{6,12}$/
  },
  experienceYears: {
    required: true,
    pattern: /^[0-9]+$/
  }
};

// --- Configuración de accesibilidad ---
export const ACCESSIBILITY_CONFIG = {
  enableScreenReader: true,
  enableKeyboardNavigation: true,
  enableHighContrast: true,
  enableReducedMotion: true,
  focusManagement: 'auto' as const,
  announcementQueue: []
};

// --- Configuración de analytics ---
export const ANALYTICS_CONFIG = {
  enableTracking: true,
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
  enableUserBehaviorTracking: true
};

// --- Configuración de seguridad ---
export const SECURITY_CONFIG = {
  enableCSRFProtection: true,
  enableXSSProtection: true,
  enableContentSecurityPolicy: true,
  enableSecureHeaders: true,
  sessionTimeout: 3600000, // 1 hora
  maxLoginAttempts: 5,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  }
};

// --- Configuración de caché ---
export const CACHE_CONFIG = {
  enableLocalStorage: true,
  enableSessionStorage: true,
  cacheExpiration: 86400000, // 24 horas
  maxCacheSize: 10 * 1024 * 1024, // 10MB
  enableCompression: true
};

// --- Configuración responsive ---
export const RESPONSIVE_CONFIG = {
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  enableMobileOptimization: true,
  enableTouchGestures: true,
  enableProgressiveEnhancement: true
};

// --- Configuración SEO ---
export const SEO_CONFIG = {
  title: 'AiDuxCare - Registro de Profesionales Médicos',
  description: 'Regístrate como profesional médico en AiDuxCare, el asistente clínico impulsado por IA.',
  keywords: ['médico', 'registro', 'profesional', 'salud', 'IA', 'clínica'],
  canonicalUrl: 'https://aiduxcare.com/register',
  ogImage: '/images/og-register.jpg',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Registro de Profesionales Médicos',
    description: 'Regístrate como profesional médico en AiDuxCare'
  }
};

// --- Configuración de feature flags ---
export const FEATURE_FLAGS = {
  enableAdvancedValidation: true,
  enableRealTimeValidation: true,
  enableAutoComplete: true,
  enableProgressiveEnhancement: true,
  enableExperimentalFeatures: false
};

// --- Configuración de environment ---
export const ENVIRONMENT_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTesting: process.env.NODE_ENV === 'test',
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.aiduxcare.com',
  analyticsUrl: process.env.REACT_APP_ANALYTICS_URL || 'https://analytics.aiduxcare.com',
  cdnUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.aiduxcare.com',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  buildNumber: process.env.REACT_APP_BUILD_NUMBER || '1'
};

// --- Configuración de endpoints ---
export const API_ENDPOINTS = {
  registration: '/api/v1/auth/register',
  validation: '/api/v1/auth/validate',
  consent: '/api/v1/auth/consent',
  analytics: '/api/v1/analytics',
  health: '/api/v1/health'
};

// --- Configuración de logging ---
export const LOGGING_CONFIG = {
  level: 'info' as const,
  format: 'json' as const,
  destination: 'console' as const,
  retention: 30, // días
  encryption: false
};

// --- Configuración de performance ---
export const PERFORMANCE_CONFIG = {
  enableCodeSplitting: true,
  enableLazyLoading: true,
  enableTreeShaking: true,
  enableMinification: true,
  enableCompression: true,
  enableCaching: true
};

// --- Configuración de internacionalización ---
export const I18N_CONFIG = {
  defaultLocale: 'es',
  supportedLocales: ['es', 'en', 'pt'],
  fallbackLocale: 'es',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'es-ES',
  currency: 'EUR',
  timezone: 'Europe/Madrid'
};

// --- Configuración de error handling ---
export const ERROR_CONFIG = {
  enableErrorBoundary: true,
  enableErrorReporting: true,
  enableErrorLogging: true,
  maxErrorRetries: 3,
  errorTimeout: 5000
};

// --- Configuración de form persistence ---
export const FORM_PERSISTENCE_CONFIG = {
  key: 'wizard-form-data',
  storage: 'sessionStorage' as const,
  ttl: 3600000, // 1 hora
  compression: true,
  encryption: false
};

// --- Configuración de accessibility announcements ---
export const ACCESSIBILITY_ANNOUNCEMENTS = {
  stepChange: 'Paso {current} de {total}',
  validationError: 'Error de validación en {field}',
  formComplete: 'Formulario completado exitosamente',
  consentRequired: 'Debes aceptar los consentimientos para continuar'
};

// --- Configuración de keyboard navigation ---
export const KEYBOARD_NAVIGATION_CONFIG = {
  enableTabNavigation: true,
  enableArrowNavigation: true,
  enableEnterSubmit: true,
  enableEscapeCancel: true,
  focusTrap: true
};

// --- Configuración de form validation ---
export const FORM_VALIDATION_CONFIG = {
  enableRealTimeValidation: true,
  enableAsyncValidation: true,
  enableCrossFieldValidation: true,
  validationDelay: 300,
  maxValidationRetries: 3
};

// --- Configuración de consent management ---
export const CONSENT_CONFIG = {
  enableGDPR: true,
  enableHIPAA: true,
  enableCookieConsent: true,
  enableMarketingConsent: true,
  consentExpiration: 365 // días
};

// --- Configuración de analytics events ---
export const ANALYTICS_EVENTS = {
  WIZARD_START: 'wizard_start',
  WIZARD_STEP_COMPLETE: 'wizard_step_complete',
  WIZARD_STEP_ERROR: 'wizard_step_error',
  WIZARD_COMPLETE: 'wizard_complete',
  FORM_FIELD_INTERACTION: 'form_field_interaction',
  CONSENT_ACCEPT: 'consent_accept',
  CONSENT_REJECT: 'consent_reject',
  REGISTRATION_SUCCESS: 'registration_success',
  REGISTRATION_ERROR: 'registration_error'
};

// --- Configuración de performance budgets ---
export const PERFORMANCE_BUDGETS = {
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  firstInputDelay: 100,
  cumulativeLayoutShift: 0.1,
  totalBlockingTime: 300
};

// --- Configuración de security headers ---
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

// --- Configuración de logging levels ---
export const LOGGING_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
} as const;

// --- Configuración de cache invalidation ---
export const CACHE_INVALIDATION_CONFIG = {
  strategy: 'immediate' as const,
  patterns: ['wizard-*', 'form-*', 'user-*'],
  ttl: 3600000, // 1 hora
  maxAge: 86400000 // 24 horas
};

// --- Configuración de responsive breakpoints ---
export const RESPONSIVE_BREAKPOINTS = [
  { name: 'xs', minWidth: 0, maxWidth: 639, columns: 1, gutter: 16 },
  { name: 'sm', minWidth: 640, maxWidth: 767, columns: 2, gutter: 20 },
  { name: 'md', minWidth: 768, maxWidth: 1023, columns: 2, gutter: 24 },
  { name: 'lg', minWidth: 1024, maxWidth: 1279, columns: 2, gutter: 32 },
  { name: 'xl', minWidth: 1280, maxWidth: 1535, columns: 2, gutter: 32 },
  { name: '2xl', minWidth: 1536, maxWidth: undefined, columns: 2, gutter: 40 }
];

// --- Configuración de SEO optimization ---
export const SEO_OPTIMIZATION_CONFIG = {
  titleOptimization: true,
  metaDescriptionOptimization: true,
  headingOptimization: true,
  imageOptimization: true,
  schemaMarkup: true,
  sitemapGeneration: true
};

// --- Configuración de feature rollouts ---
export const FEATURE_ROLLOUTS = [
  {
    name: 'advanced-validation',
    version: '1.0.0',
    rolloutPercentage: 100,
    targetAudience: ['all'],
    metrics: ['validation-accuracy', 'user-satisfaction'],
    rollbackPlan: 'disable-advanced-validation'
  }
];

// --- Configuración de environment management ---
export const ENVIRONMENT_MANAGEMENT = {
  development: {
    name: 'development',
    apiUrl: 'http://localhost:3001',
    analyticsUrl: 'http://localhost:3002',
    cdnUrl: 'http://localhost:3003',
    version: '1.0.0-dev',
    buildNumber: 'dev-1',
    features: []
  },
  staging: {
    name: 'staging',
    apiUrl: 'https://staging-api.aiduxcare.com',
    analyticsUrl: 'https://staging-analytics.aiduxcare.com',
    cdnUrl: 'https://staging-cdn.aiduxcare.com',
    version: '1.0.0-staging',
    buildNumber: 'staging-1',
    features: []
  },
  production: {
    name: 'production',
    apiUrl: 'https://api.aiduxcare.com',
    analyticsUrl: 'https://analytics.aiduxcare.com',
    cdnUrl: 'https://cdn.aiduxcare.com',
    version: '1.0.0',
    buildNumber: '1',
    features: []
  },
  testing: {
    name: 'testing',
    apiUrl: 'http://localhost:3001',
    analyticsUrl: 'http://localhost:3002',
    cdnUrl: 'http://localhost:3003',
    version: '1.0.0-test',
    buildNumber: 'test-1',
    features: []
  }
};

// --- Configuración de API versioning ---
export const API_VERSIONING = {
  current: 'v1',
  supported: ['v1'],
  deprecated: [],
  sunset: [],
  migrationGuide: 'https://docs.aiduxcare.com/api/migration'
};

// --- Configuración de response caching ---
export const RESPONSE_CACHING_CONFIG = {
  strategy: 'cache-first' as const,
  ttl: 3600000, // 1 hora
  maxAge: 86400000, // 24 horas
  staleWhileRevalidate: 300000 // 5 minutos
};

// --- Configuración de form accessibility ---
export const FORM_ACCESSIBILITY_CONFIG = {
  labels: true,
  descriptions: true,
  errorMessages: true,
  keyboardNavigation: true,
  screenReaderSupport: true,
  highContrast: true
};

// --- Configuración de performance optimization ---
export const PERFORMANCE_OPTIMIZATION_CONFIG = {
  codeSplitting: true,
  lazyLoading: true,
  treeShaking: true,
  minification: true,
  compression: true,
  caching: true
};

// --- Configuración de security hardening ---
export const SECURITY_HARDENING_CONFIG = {
  inputSanitization: true,
  outputEncoding: true,
  sqlInjectionProtection: true,
  xssProtection: true,
  csrfProtection: true,
  clickjackingProtection: true
};

// --- Configuración de logging configuration ---
export const LOGGING_CONFIGURATION = {
  level: 'info' as const,
  format: 'json' as const,
  destination: 'console' as const,
  retention: 30, // días
  encryption: false
};

// --- Configuración de cache management ---
export const CACHE_MANAGEMENT_CONFIG = {
  strategy: 'LRU' as const,
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 86400000, // 24 horas
  compression: true,
  encryption: false
};

// --- Configuración de responsive design system ---
export const RESPONSIVE_DESIGN_SYSTEM = {
  breakpoints: RESPONSIVE_BREAKPOINTS,
  grid: {
    columns: 12,
    gutter: 24,
    margin: 16
  },
  typography: {
    scale: [0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 3.75, 4.5, 6, 7.5, 9],
    lineHeight: [1, 1.25, 1.5, 1.75, 2],
    fontWeight: [300, 400, 500, 600, 700, 800, 900]
  },
  spacing: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96],
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    }
  }
};

// --- Configuración de environment deployment ---
export const ENVIRONMENT_DEPLOYMENT_CONFIG = {
  strategy: 'blue-green' as const,
  healthChecks: true,
  rollback: true,
  monitoring: true,
  alerting: true
};

// --- Configuración de API documentation ---
export const API_DOCUMENTATION_CONFIG = {
  version: '1.0.0',
  baseUrl: 'https://api.aiduxcare.com',
  endpoints: [
    {
      path: '/api/v1/auth/register',
      method: 'POST',
      description: 'Registrar un nuevo usuario',
      parameters: [],
      responses: []
    }
  ],
  schemas: {},
  examples: {}
};

// --- Configuración de response transformation ---
export const RESPONSE_TRANSFORMATION_CONFIG = {
  mapping: {},
  filtering: [],
  sorting: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  }
};

// --- Configuración de form validation rules ---
export const FORM_VALIDATION_RULES_CONFIG = {
  required: true,
  minLength: 1,
  maxLength: 255,
  pattern: undefined,
  custom: undefined,
  message: 'Campo requerido',
  async: undefined
};

// --- Configuración de accessibility compliance ---
export const ACCESSIBILITY_COMPLIANCE_CONFIG = {
  wcag2_1_aa: {
    passed: 0,
    failed: 0,
    warnings: 0,
    violations: []
  },
  section508: {
    passed: 0,
    failed: 0,
    violations: []
  },
  aria: {
    valid: true,
    missing: [],
    invalid: []
  }
};

// --- Configuración de performance metrics ---
export const PERFORMANCE_METRICS_CONFIG = {
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  firstInputDelay: 0,
  cumulativeLayoutShift: 0,
  totalBlockingTime: 0,
  speedIndex: 0,
  timeToInteractive: 0,
  timeToFirstByte: 0
};

// --- Configuración de security audit ---
export const SECURITY_AUDIT_CONFIG = {
  vulnerabilities: [],
  compliance: {
    gdpr: true,
    hipaa: true,
    sox: false,
    pci: false
  },
  recommendations: []
};

// --- Configuración de cache performance ---
export const CACHE_PERFORMANCE_CONFIG = {
  hitRate: 0,
  missRate: 0,
  evictionRate: 0,
  averageLoadTime: 0,
  memoryUsage: 0,
  storageSize: 0
};

// --- Configuración de responsive performance ---
export const RESPONSIVE_PERFORMANCE_CONFIG = {
  mobileScore: 0,
  desktopScore: 0,
  tabletScore: 0,
  optimization: {
    images: true,
    fonts: true,
    css: true,
    javascript: true
  }
};

// --- Configuración de SEO performance ---
export const SEO_PERFORMANCE_CONFIG = {
  organicTraffic: 0,
  keywordRankings: {},
  clickThroughRate: 0,
  bounceRate: 0,
  conversionRate: 0,
  pageSpeed: 0,
  mobileFriendliness: 0,
  accessibility: 0
};

// --- Configuración de feature performance ---
export const FEATURE_PERFORMANCE_CONFIG = {
  adoption: 0,
  usage: 0,
  retention: 0,
  satisfaction: 0,
  performance: 0,
  errors: 0
};

// --- Configuración de environment performance ---
export const ENVIRONMENT_PERFORMANCE_CONFIG = {
  uptime: 0,
  responseTime: 0,
  errorRate: 0,
  throughput: 0,
  resourceUtilization: 0,
  availability: 0
};

// --- Configuración de API performance ---
export const API_PERFORMANCE_CONFIG = {
  responseTime: 0,
  throughput: 0,
  errorRate: 0,
  availability: 0,
  latency: 0,
  successRate: 0
};

// --- Configuración de response performance ---
export const RESPONSE_PERFORMANCE_CONFIG = {
  size: 0,
  compression: 0,
  loadTime: 0,
  renderTime: 0,
  interactiveTime: 0,
  totalTime: 0
};

// --- Configuración de form performance ---
export const FORM_PERFORMANCE_CONFIG = {
  loadTime: 0,
  validationTime: 0,
  submissionTime: 0,
  errorRate: 0,
  completionRate: 0,
  abandonmentRate: 0
};

// --- Configuración de accessibility performance ---
export const ACCESSIBILITY_PERFORMANCE_CONFIG = {
  compliance: 0,
  usability: 0,
  navigation: 0,
  comprehension: 0,
  efficiency: 0,
  satisfaction: 0
};

// --- Configuración de logging performance ---
export const LOGGING_PERFORMANCE_CONFIG = {
  throughput: 0,
  latency: 0,
  storage: 0,
  retention: 0,
  search: 0,
  analysis: 0
};

// --- Configuración de cache analytics ---
export const CACHE_ANALYTICS_CONFIG = {
  hitRate: 0,
  missRate: 0,
  evictionRate: 0,
  loadTime: 0,
  size: 0,
  efficiency: 0
};

// --- Configuración de responsive analytics ---
export const RESPONSIVE_ANALYTICS_CONFIG = {
  deviceBreakdown: {},
  screenSizeDistribution: {},
  orientationUsage: {},
  interactionPatterns: {},
  performanceByDevice: {}
};

// --- Configuración de SEO analytics ---
export const SEO_ANALYTICS_CONFIG = {
  organicTraffic: 0,
  keywordRankings: {},
  clickThroughRate: 0,
  bounceRate: 0,
  conversionRate: 0,
  pageSpeed: 0,
  mobileFriendliness: 0,
  accessibility: 0
};

// --- Configuración de feature analytics ---
export const FEATURE_ANALYTICS_CONFIG = {
  adoption: 0,
  usage: 0,
  retention: 0,
  satisfaction: 0,
  performance: 0,
  errors: 0,
  impact: 0
};

// --- Configuración de environment analytics ---
export const ENVIRONMENT_ANALYTICS_CONFIG = {
  uptime: 0,
  responseTime: 0,
  errorRate: 0,
  throughput: 0,
  resourceUtilization: 0,
  availability: 0,
  performance: 0
};

// --- Configuración de API analytics ---
export const API_ANALYTICS_CONFIG = {
  responseTime: 0,
  throughput: 0,
  errorRate: 0,
  availability: 0,
  latency: 0,
  successRate: 0,
  usage: 0
};

// --- Configuración de response analytics ---
export const RESPONSE_ANALYTICS_CONFIG = {
  size: 0,
  compression: 0,
  loadTime: 0,
  renderTime: 0,
  interactiveTime: 0,
  totalTime: 0,
  efficiency: 0
};

// --- Configuración de form analytics ---
export const FORM_ANALYTICS_CONFIG = {
  loadTime: 0,
  validationTime: 0,
  submissionTime: 0,
  errorRate: 0,
  completionRate: 0,
  abandonmentRate: 0,
  conversionRate: 0
};

// --- Configuración de accessibility analytics ---
export const ACCESSIBILITY_ANALYTICS_CONFIG = {
  compliance: 0,
  usability: 0,
  navigation: 0,
  comprehension: 0,
  efficiency: 0,
  satisfaction: 0,
  adoption: 0
};

// --- Configuración de logging analytics ---
export const LOGGING_ANALYTICS_CONFIG = {
  throughput: 0,
  latency: 0,
  storage: 0,
  retention: 0,
  search: 0,
  analysis: 0,
  efficiency: 0
};

// --- Configuración de cache monitoring ---
export const CACHE_MONITORING_CONFIG = {
  hitRate: 0,
  missRate: 0,
  evictionRate: 0,
  loadTime: 0,
  size: 0,
  efficiency: 0,
  alerts: []
};

// --- Configuración de responsive monitoring ---
export const RESPONSIVE_MONITORING_CONFIG = {
  deviceBreakdown: {},
  screenSizeDistribution: {},
  orientationUsage: {},
  interactionPatterns: {},
  performanceByDevice: {},
  alerts: []
};

// --- Configuración de SEO monitoring ---
export const SEO_MONITORING_CONFIG = {
  organicTraffic: 0,
  keywordRankings: {},
  clickThroughRate: 0,
  bounceRate: 0,
  conversionRate: 0,
  pageSpeed: 0,
  mobileFriendliness: 0,
  accessibility: 0,
  alerts: []
};

// --- Configuración de feature monitoring ---
export const FEATURE_MONITORING_CONFIG = {
  adoption: 0,
  usage: 0,
  retention: 0,
  satisfaction: 0,
  performance: 0,
  errors: 0,
  impact: 0,
  alerts: []
};

// --- Configuración de environment monitoring ---
export const ENVIRONMENT_MONITORING_CONFIG = {
  uptime: 0,
  responseTime: 0,
  errorRate: 0,
  throughput: 0,
  resourceUtilization: 0,
  availability: 0,
  performance: 0,
  alerts: []
};

// --- Configuración de API monitoring ---
export const API_MONITORING_CONFIG = {
  responseTime: 0,
  throughput: 0,
  errorRate: 0,
  availability: 0,
  latency: 0,
  successRate: 0,
  usage: 0,
  alerts: []
};

// --- Configuración de response monitoring ---
export const RESPONSE_MONITORING_CONFIG = {
  size: 0,
  compression: 0,
  loadTime: 0,
  renderTime: 0,
  interactiveTime: 0,
  totalTime: 0,
  efficiency: 0,
  alerts: []
};

// --- Configuración de form monitoring ---
export const FORM_MONITORING_CONFIG = {
  loadTime: 0,
  validationTime: 0,
  submissionTime: 0,
  errorRate: 0,
  completionRate: 0,
  abandonmentRate: 0,
  conversionRate: 0,
  alerts: []
};

// --- Configuración de accessibility monitoring ---
export const ACCESSIBILITY_MONITORING_CONFIG = {
  compliance: 0,
  usability: 0,
  navigation: 0,
  comprehension: 0,
  efficiency: 0,
  satisfaction: 0,
  adoption: 0,
  alerts: []
};

// --- Configuración de logging monitoring ---
export const LOGGING_MONITORING_CONFIG = {
  throughput: 0,
  latency: 0,
  storage: 0,
  retention: 0,
  search: 0,
  analysis: 0,
  efficiency: 0,
  alerts: []
}; 