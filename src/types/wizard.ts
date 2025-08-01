/**
 * @fileoverview Tipos TypeScript estrictos para el wizard de registro enterprise
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

// --- Enums para valores constantes ---
export enum WizardStep {
  PERSONAL_DATA = 0,
  PROFESSIONAL_DATA = 1,
  LOCATION_CONSENT = 2
}

export enum TabType {
  LOGIN = 'login',
  REGISTER = 'register'
}

export enum Gender {
  MALE = 'masculino',
  FEMALE = 'femenino',
  OTHER = 'otro',
  PREFER_NOT_TO_SAY = 'prefiero-no-decir'
}

export enum Specialty {
  PHYSIOTHERAPY = 'fisioterapia',
  FAMILY_MEDICINE = 'medicina-familiar',
  TRAUMATOLOGY = 'traumatologia',
  REHABILITATION = 'rehabilitacion',
  INTERNAL_MEDICINE = 'medicina-interna',
  DERMATOLOGY = 'dermatologia',
  PSYCHOLOGY = 'psicologia',
  NURSING = 'enfermeria',
  OTHER = 'otro'
}

export enum ExperienceLevel {
  BEGINNER = '0-2',
  JUNIOR = '3-5',
  MID_LEVEL = '6-10',
  SENIOR = '10-15',
  EXPERT = '15+'
}

export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong'
}

// --- Interfaces principales ---
export interface UserData {
  // Datos personales
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  gender: Gender | '';
  password: string;
  confirmPassword: string;
  
  // Datos profesionales
  specialty: Specialty | '';
  licenseNumber: string;
  workplace: string;
  university: string;
  professionalTitle: string;
  experienceYears: ExperienceLevel | '';
  
  // Datos de ubicación y consentimiento
  country: string;
  province: string;
  city: string;
  consentGDPR: boolean;
  consentHIPAA: boolean;
}

export interface ValidationError {
  field: keyof UserData;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface WizardState {
  currentStep: WizardStep;
  activeTab: TabType;
  userData: UserData;
  errors: Record<keyof UserData, string>;
  loading: boolean;
  isComplete: boolean;
}

export interface WizardActions {
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: WizardStep) => void;
  updateUserData: (field: keyof UserData, value: any) => void;
  validateStep: (step: WizardStep) => ValidationResult;
  submitRegistration: () => Promise<void>;
}

// --- Interfaces para componentes ---
export interface FormFieldProps {
  label: string;
  name: keyof UserData;
  type?: 'text' | 'email' | 'password' | 'tel' | 'date' | 'select';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  autoComplete?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export interface ConsentCheckboxProps {
  id: string;
  name: keyof UserData;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export interface WizardStepProps {
  userData: UserData;
  errors: Record<keyof UserData, string>;
  onFieldChange: (field: keyof UserData, value: any) => void;
  onValidation: (step: WizardStep) => ValidationResult;
}

export interface WizardProgressBarProps {
  currentStep: WizardStep;
  totalSteps: number;
  steps: Array<{
    title: string;
    description: string;
    isCompleted: boolean;
  }>;
}

export interface WizardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  disabled?: boolean;
}

// --- Interfaces para hooks ---
export interface UseWizardReturn {
  state: WizardState;
  actions: WizardActions;
}

export interface UseFormValidationReturn {
  validateField: (field: keyof UserData, value: any) => string | undefined;
  validateStep: (step: WizardStep) => ValidationResult;
  clearErrors: () => void;
  setFieldError: (field: keyof UserData, error: string) => void;
}

export interface UseConsentReturn {
  isConsentValid: boolean;
  consentErrors: string[];
  validateConsent: () => boolean;
  acceptAllConsent: () => void;
  rejectAllConsent: () => void;
}

// --- Interfaces para utilidades ---
export interface ValidationRule {
  field: keyof UserData;
  validator: (value: any) => boolean;
  message: string;
  code?: string;
}

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
}

// --- Interfaces para internacionalización ---
export interface I18nTexts {
  title: string;
  description: string;
  tabs: Record<TabType, string>;
  steps: Array<{
    title: string;
    description: string;
  }>;
  fields: Record<keyof UserData, string>;
  errors: Record<string, string>;
  consent: {
    gdpr: string;
    hipaa: string;
    required: string;
  };
  buttons: {
    next: string;
    previous: string;
    submit: string;
    loading: string;
  };
  copyright: string;
}

// --- Interfaces para analytics ---
export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

export interface WizardAnalytics {
  trackStepView: (step: WizardStep) => void;
  trackStepComplete: (step: WizardStep) => void;
  trackFieldInteraction: (field: keyof UserData, action: string) => void;
  trackConsentInteraction: (consentType: 'GDPR' | 'HIPAA', action: 'accept' | 'reject') => void;
  trackRegistrationComplete: (success: boolean) => void;
}

// --- Interfaces para configuración ---
export interface WizardConfig {
  enableAnalytics: boolean;
  enableAccessibility: boolean;
  enableInternationalization: boolean;
  enablePasswordStrength: boolean;
  enableAutoSave: boolean;
  maxRetries: number;
  validationDelay: number;
  autoAdvanceDelay: number;
}

// --- Tipos para testing ---
export interface TestIds {
  wizardContainer: string;
  wizardProgressBar: string;
  wizardTabs: string;
  formField: (name: keyof UserData) => string;
  consentCheckbox: (name: keyof UserData) => string;
  stepContent: (step: WizardStep) => string;
  navigationButton: (direction: 'next' | 'previous') => string;
  submitButton: string;
}

// --- Tipos para error handling ---
export interface WizardError {
  code: string;
  message: string;
  field?: keyof UserData;
  step?: WizardStep;
  timestamp: Date;
  userAgent?: string;
  sessionId?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: WizardError;
  errorInfo?: React.ErrorInfo;
}

// --- Tipos para performance monitoring ---
export interface WizardPerformanceMetrics {
  stepLoadTime: Record<WizardStep, number>;
  validationTime: Record<WizardStep, number>;
  totalCompletionTime: number;
  userInteractions: Array<{
    timestamp: Date;
    action: string;
    field?: keyof UserData;
    step?: WizardStep;
  }>;
}

// --- Tipos para accessibility ---
export interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  focusManagement: 'auto' | 'manual';
  announcementQueue: Array<{
    message: string;
    priority: 'low' | 'medium' | 'high';
    timestamp: Date;
  }>;
}

// --- Tipos para internacionalización ---
export interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
  dateFormat: string;
  numberFormat: string;
  currency: string;
  timezone: string;
}

// --- Tipos para seguridad ---
export interface SecurityConfig {
  enableCSRFProtection: boolean;
  enableXSSProtection: boolean;
  enableContentSecurityPolicy: boolean;
  enableSecureHeaders: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

// --- Tipos para logging ---
export interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  stackTrace?: string;
}

// --- Tipos para caching ---
export interface CacheConfig {
  enableLocalStorage: boolean;
  enableSessionStorage: boolean;
  cacheExpiration: number;
  maxCacheSize: number;
  enableCompression: boolean;
}

// --- Tipos para responsive design ---
export interface Breakpoint {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export interface ResponsiveConfig {
  breakpoints: Breakpoint;
  enableMobileOptimization: boolean;
  enableTouchGestures: boolean;
  enableProgressiveEnhancement: boolean;
}

// --- Tipos para SEO ---
export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  structuredData: Record<string, any>;
}

// --- Tipos para feature flags ---
export interface FeatureFlags {
  enableAdvancedValidation: boolean;
  enableRealTimeValidation: boolean;
  enableAutoComplete: boolean;
  enableProgressiveEnhancement: boolean;
  enableExperimentalFeatures: boolean;
}

// --- Tipos para environment ---
export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTesting: boolean;
  apiUrl: string;
  analyticsUrl: string;
  cdnUrl: string;
  version: string;
  buildNumber: string;
}

// --- Tipos para API responses ---
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: Date;
    version: string;
    requestId: string;
  };
}

export interface RegistrationResponse {
  userId: string;
  email: string;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Date;
  verificationRequired: boolean;
  welcomeEmailSent: boolean;
}

// --- Tipos para form state management ---
export interface FormState<T = UserData> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  dirty: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitCount: number;
}

export interface FormActions<T = UserData> {
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, touched: boolean) => void;
  setDirty: (field: keyof T, dirty: boolean) => void;
  reset: () => void;
  validate: () => Promise<ValidationResult>;
  submit: () => Promise<void>;
}

// --- Tipos para accessibility announcements ---
export interface AccessibilityAnnouncement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: Date;
  expiresAt?: Date;
  isRead: boolean;
}

// --- Tipos para keyboard navigation ---
export interface KeyboardNavigation {
  currentFocus: string;
  focusableElements: string[];
  focusHistory: string[];
  tabIndex: number;
  isNavigating: boolean;
}

// --- Tipos para form validation schemas ---
export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    message?: string;
  };
}

// --- Tipos para error boundaries ---
export interface ErrorBoundaryProps {
  fallback: React.ComponentType<{ error: WizardError; resetError: () => void }>;
  onError?: (error: WizardError, errorInfo: React.ErrorInfo) => void;
  children: React.ReactNode;
}

// --- Tipos para performance monitoring ---
export interface PerformanceObserver {
  observe: (entry: PerformanceEntry) => void;
  disconnect: () => void;
}

export interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  timestamp: number;
}

// --- Tipos para analytics tracking ---
export interface AnalyticsTracker {
  track: (event: AnalyticsEvent) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name: string, properties?: Record<string, any>) => void;
  group: (groupId: string, traits?: Record<string, any>) => void;
}

// --- Tipos para internationalization ---
export interface I18nInstance {
  t: (key: string, options?: Record<string, any>) => string;
  changeLanguage: (language: string) => Promise<void>;
  language: string;
  languages: string[];
  isInitialized: boolean;
}

// --- Tipos para security validation ---
export interface SecurityValidation {
  isCSRFTokenValid: boolean;
  isXSSProtected: boolean;
  isContentSecure: boolean;
  isSessionValid: boolean;
  isRateLimited: boolean;
}

// --- Tipos para caching strategies ---
export interface CacheStrategy {
  key: string;
  ttl: number;
  maxSize: number;
  compression: boolean;
  version: string;
}

// --- Tipos para responsive breakpoints ---
export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
  columns: number;
  gutter: number;
}

// --- Tipos para SEO metadata ---
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  robots: string;
  canonical: string;
  og: {
    title: string;
    description: string;
    image: string;
    type: string;
    url: string;
  };
  twitter: {
    card: string;
    site: string;
    creator: string;
  };
}

// --- Tipos para feature toggles ---
export interface FeatureToggle {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetAudience: string[];
  dependencies: string[];
}

// --- Tipos para environment variables ---
export interface EnvironmentVariables {
  NODE_ENV: string;
  REACT_APP_API_URL: string;
  REACT_APP_ANALYTICS_ID: string;
  REACT_APP_SENTRY_DSN: string;
  REACT_APP_GOOGLE_ANALYTICS_ID: string;
  REACT_APP_FACEBOOK_PIXEL_ID: string;
}

// --- Tipos para API endpoints ---
export interface APIEndpoints {
  registration: string;
  validation: string;
  consent: string;
  analytics: string;
  health: string;
}

// --- Tipos para response handling ---
export interface ResponseHandler {
  success: (data: any) => void;
  error: (error: any) => void;
  loading: (isLoading: boolean) => void;
}

// --- Tipos para form persistence ---
export interface FormPersistence {
  save: (data: UserData) => void;
  load: () => UserData | null;
  clear: () => void;
  hasData: () => boolean;
}

// --- Tipos para accessibility compliance ---
export interface AccessibilityCompliance {
  wcag2_1_aa: boolean;
  wcag2_1_aaa: boolean;
  section508: boolean;
  aria: boolean;
  keyboard: boolean;
  screenReader: boolean;
}

// --- Tipos para performance budgets ---
export interface PerformanceBudget {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
}

// --- Tipos para security headers ---
export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

// --- Tipos para logging levels ---
export interface LoggingLevels {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
  TRACE: 4;
}

// --- Tipos para cache invalidation ---
export interface CacheInvalidation {
  strategy: 'immediate' | 'lazy' | 'scheduled';
  patterns: string[];
  ttl: number;
  maxAge: number;
}

// --- Tipos para responsive images ---
export interface ResponsiveImage {
  src: string;
  srcSet: string;
  sizes: string;
  alt: string;
  width: number;
  height: number;
  loading: 'lazy' | 'eager';
}

// --- Tipos para SEO structured data ---
export interface StructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  sameAs?: string[];
  [key: string]: any;
}

// --- Tipos para feature flags ---
export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetAudience: string[];
  dependencies: string[];
}

// --- Tipos para environment configuration ---
export interface EnvironmentConfiguration {
  name: string;
  apiUrl: string;
  analyticsUrl: string;
  cdnUrl: string;
  version: string;
  buildNumber: string;
  features: FeatureFlag[];
}

// --- Tipos para API authentication ---
export interface APIAuthentication {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
  type: 'Bearer' | 'Basic' | 'OAuth2';
}

// --- Tipos para response validation ---
export interface ResponseValidation {
  schema: any;
  strict: boolean;
  coerce: boolean;
  stripUnknown: boolean;
}

// --- Tipos para form state persistence ---
export interface FormStatePersistence {
  key: string;
  storage: 'localStorage' | 'sessionStorage' | 'memory';
  ttl: number;
  compression: boolean;
  encryption: boolean;
}

// --- Tipos para accessibility testing ---
export interface AccessibilityTesting {
  axe: boolean;
  lighthouse: boolean;
  wave: boolean;
  manual: boolean;
  automated: boolean;
}

// --- Tipos para performance monitoring ---
export interface PerformanceMonitoring {
  realUserMonitoring: boolean;
  syntheticMonitoring: boolean;
  errorTracking: boolean;
  resourceTiming: boolean;
  navigationTiming: boolean;
}

// --- Tipos para security scanning ---
export interface SecurityScanning {
  staticAnalysis: boolean;
  dynamicAnalysis: boolean;
  dependencyScanning: boolean;
  containerScanning: boolean;
  infrastructureScanning: boolean;
}

// --- Tipos para cache warming ---
export interface CacheWarming {
  strategy: 'preload' | 'prefetch' | 'prerender';
  urls: string[];
  priority: 'high' | 'medium' | 'low';
  frequency: 'once' | 'daily' | 'weekly';
}

// --- Tipos para responsive navigation ---
export interface ResponsiveNavigation {
  breakpoint: string;
  type: 'hamburger' | 'tabs' | 'dropdown' | 'sidebar';
  items: Array<{
    label: string;
    href: string;
    icon?: string;
    badge?: string;
  }>;
}

// --- Tipos para SEO optimization ---
export interface SEOOptimization {
  titleOptimization: boolean;
  metaDescriptionOptimization: boolean;
  headingOptimization: boolean;
  imageOptimization: boolean;
  schemaMarkup: boolean;
  sitemapGeneration: boolean;
}

// --- Tipos para feature rollouts ---
export interface FeatureRollout {
  name: string;
  version: string;
  rolloutPercentage: number;
  targetAudience: string[];
  metrics: string[];
  rollbackPlan: string;
}

// --- Tipos para environment management ---
export interface EnvironmentManagement {
  development: EnvironmentConfiguration;
  staging: EnvironmentConfiguration;
  production: EnvironmentConfiguration;
  testing: EnvironmentConfiguration;
}

// --- Tipos para API versioning ---
export interface APIVersioning {
  current: string;
  supported: string[];
  deprecated: string[];
  sunset: string[];
  migrationGuide: string;
}

// --- Tipos para response caching ---
export interface ResponseCaching {
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
  ttl: number;
  maxAge: number;
  staleWhileRevalidate: number;
}

// --- Tipos para form accessibility ---
export interface FormAccessibility {
  labels: boolean;
  descriptions: boolean;
  errorMessages: boolean;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  highContrast: boolean;
}

// --- Tipos para performance optimization ---
export interface PerformanceOptimization {
  codeSplitting: boolean;
  lazyLoading: boolean;
  treeShaking: boolean;
  minification: boolean;
  compression: boolean;
  caching: boolean;
}

// --- Tipos para security hardening ---
export interface SecurityHardening {
  inputSanitization: boolean;
  outputEncoding: boolean;
  sqlInjectionProtection: boolean;
  xssProtection: boolean;
  csrfProtection: boolean;
  clickjackingProtection: boolean;
}

// --- Tipos para logging configuration ---
export interface LoggingConfiguration {
  level: keyof LoggingLevels;
  format: 'json' | 'text' | 'structured';
  destination: 'console' | 'file' | 'remote';
  retention: number;
  encryption: boolean;
}

// --- Tipos para cache management ---
export interface CacheManagement {
  strategy: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  maxSize: number;
  maxAge: number;
  compression: boolean;
  encryption: boolean;
}

// --- Tipos para responsive design system ---
export interface ResponsiveDesignSystem {
  breakpoints: ResponsiveBreakpoint[];
  grid: {
    columns: number;
    gutter: number;
    margin: number;
  };
  typography: {
    scale: number[];
    lineHeight: number[];
    fontWeight: number[];
  };
  spacing: number[];
  colors: Record<string, string>;
}

// --- Tipos para SEO analytics ---
export interface WizardSEOAnalytics {
  organicTraffic: number;
  keywordRankings: Record<string, number>;
  clickThroughRate: number;
  bounceRate: number;
  conversionRate: number;
  pageSpeed: number;
}

// --- Tipos para feature management ---
export interface FeatureManagement {
  flags: FeatureFlag[];
  rollouts: FeatureRollout[];
  experiments: Array<{
    name: string;
    variants: string[];
    trafficSplit: number[];
    metrics: string[];
  }>;
}

// --- Tipos para environment deployment ---
export interface EnvironmentDeployment {
  strategy: 'blue-green' | 'canary' | 'rolling' | 'recreate';
  healthChecks: boolean;
  rollback: boolean;
  monitoring: boolean;
  alerting: boolean;
}

// --- Tipos para API documentation ---
export interface APIDocumentation {
  version: string;
  baseUrl: string;
  endpoints: Array<{
    path: string;
    method: string;
    description: string;
    parameters: any[];
    responses: any[];
  }>;
  schemas: Record<string, any>;
  examples: Record<string, any>;
}

// --- Tipos para response transformation ---
export interface ResponseTransformation {
  mapping: Record<string, string>;
  filtering: string[];
  sorting: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// --- Tipos para form validation rules ---
export interface FormValidationRules {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
  async?: (value: any) => Promise<boolean>;
}

// --- Tipos para accessibility compliance ---
export interface AccessibilityComplianceReport {
  wcag2_1_aa: {
    passed: number;
    failed: number;
    warnings: number;
    violations: Array<{
      rule: string;
      impact: 'minor' | 'moderate' | 'serious' | 'critical';
      description: string;
      element: string;
    }>;
  };
  section508: {
    passed: number;
    failed: number;
    violations: any[];
  };
  aria: {
    valid: boolean;
    missing: string[];
    invalid: string[];
  };
}

// --- Tipos para performance metrics ---
export interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
  timeToInteractive: number;
  timeToFirstByte: number;
}

// --- Tipos para security audit ---
export interface SecurityAudit {
  vulnerabilities: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    cve?: string;
    cvss?: number;
    remediation: string;
  }>;
  compliance: {
    gdpr: boolean;
    hipaa: boolean;
    sox: boolean;
    pci: boolean;
  };
  recommendations: string[];
}

// --- Tipos para cache performance ---
export interface CachePerformance {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageLoadTime: number;
  memoryUsage: number;
  storageSize: number;
}

// --- Tipos para responsive performance ---
export interface ResponsivePerformance {
  mobileScore: number;
  desktopScore: number;
  tabletScore: number;
  optimization: {
    images: boolean;
    fonts: boolean;
    css: boolean;
    javascript: boolean;
  };
}

// --- Tipos para SEO performance ---
export interface SEOPerformance {
  organicTraffic: number;
  keywordRankings: Record<string, number>;
  clickThroughRate: number;
  bounceRate: number;
  conversionRate: number;
  pageSpeed: number;
  mobileFriendliness: number;
  accessibility: number;
}

// --- Tipos para feature performance ---
export interface FeaturePerformance {
  adoption: number;
  usage: number;
  retention: number;
  satisfaction: number;
  performance: number;
  errors: number;
}

// --- Tipos para environment performance ---
export interface EnvironmentPerformance {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  resourceUtilization: number;
  availability: number;
}

// --- Tipos para API performance ---
export interface APIPerformance {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  latency: number;
  successRate: number;
}

// --- Tipos para response performance ---
export interface ResponsePerformance {
  size: number;
  compression: number;
  loadTime: number;
  renderTime: number;
  interactiveTime: number;
  totalTime: number;
}

// --- Tipos para form performance ---
export interface FormPerformance {
  loadTime: number;
  validationTime: number;
  submissionTime: number;
  errorRate: number;
  completionRate: number;
  abandonmentRate: number;
}

// --- Tipos para accessibility performance ---
export interface AccessibilityPerformance {
  compliance: number;
  usability: number;
  navigation: number;
  comprehension: number;
  efficiency: number;
  satisfaction: number;
}

// --- Tipos para logging performance ---
export interface LoggingPerformance {
  throughput: number;
  latency: number;
  storage: number;
  retention: number;
  search: number;
  analysis: number;
}

// --- Tipos para cache analytics ---
export interface CacheAnalytics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  loadTime: number;
  size: number;
  efficiency: number;
}

// --- Tipos para responsive analytics ---
export interface ResponsiveAnalytics {
  deviceBreakdown: Record<string, number>;
  screenSizeDistribution: Record<string, number>;
  orientationUsage: Record<string, number>;
  interactionPatterns: Record<string, number>;
  performanceByDevice: Record<string, number>;
}

// --- Tipos para SEO analytics ---
export interface SEOAnalytics {
  organicTraffic: number;
  keywordRankings: Record<string, number>;
  clickThroughRate: number;
  bounceRate: number;
  conversionRate: number;
  pageSpeed: number;
  mobileFriendliness: number;
  accessibility: number;
}

// --- Tipos para feature analytics ---
export interface FeatureAnalytics {
  adoption: number;
  usage: number;
  retention: number;
  satisfaction: number;
  performance: number;
  errors: number;
  impact: number;
}

// --- Tipos para environment analytics ---
export interface EnvironmentAnalytics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  resourceUtilization: number;
  availability: number;
  performance: number;
}

// --- Tipos para API analytics ---
export interface APIAnalytics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  latency: number;
  successRate: number;
  usage: number;
}

// --- Tipos para response analytics ---
export interface ResponseAnalytics {
  size: number;
  compression: number;
  loadTime: number;
  renderTime: number;
  interactiveTime: number;
  totalTime: number;
  efficiency: number;
}

// --- Tipos para form analytics ---
export interface FormAnalytics {
  loadTime: number;
  validationTime: number;
  submissionTime: number;
  errorRate: number;
  completionRate: number;
  abandonmentRate: number;
  conversionRate: number;
}

// --- Tipos para accessibility analytics ---
export interface AccessibilityAnalytics {
  compliance: number;
  usability: number;
  navigation: number;
  comprehension: number;
  efficiency: number;
  satisfaction: number;
  adoption: number;
}

// --- Tipos para logging analytics ---
export interface LoggingAnalytics {
  throughput: number;
  latency: number;
  storage: number;
  retention: number;
  search: number;
  analysis: number;
  efficiency: number;
}

// --- Tipos para cache monitoring ---
export interface CacheMonitoring {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  loadTime: number;
  size: number;
  efficiency: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para responsive monitoring ---
export interface ResponsiveMonitoring {
  deviceBreakdown: Record<string, number>;
  screenSizeDistribution: Record<string, number>;
  orientationUsage: Record<string, number>;
  interactionPatterns: Record<string, number>;
  performanceByDevice: Record<string, number>;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para SEO monitoring ---
export interface SEOMonitoring {
  organicTraffic: number;
  keywordRankings: Record<string, number>;
  clickThroughRate: number;
  bounceRate: number;
  conversionRate: number;
  pageSpeed: number;
  mobileFriendliness: number;
  accessibility: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para feature monitoring ---
export interface FeatureMonitoring {
  adoption: number;
  usage: number;
  retention: number;
  satisfaction: number;
  performance: number;
  errors: number;
  impact: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para environment monitoring ---
export interface EnvironmentMonitoring {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  resourceUtilization: number;
  availability: number;
  performance: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para API monitoring ---
export interface APIMonitoring {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  latency: number;
  successRate: number;
  usage: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para response monitoring ---
export interface ResponseMonitoring {
  size: number;
  compression: number;
  loadTime: number;
  renderTime: number;
  interactiveTime: number;
  totalTime: number;
  efficiency: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para form monitoring ---
export interface FormMonitoring {
  loadTime: number;
  validationTime: number;
  submissionTime: number;
  errorRate: number;
  completionRate: number;
  abandonmentRate: number;
  conversionRate: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para accessibility monitoring ---
export interface AccessibilityMonitoring {
  compliance: number;
  usability: number;
  navigation: number;
  comprehension: number;
  efficiency: number;
  satisfaction: number;
  adoption: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Tipos para logging monitoring ---
export interface LoggingMonitoring {
  throughput: number;
  latency: number;
  storage: number;
  retention: number;
  search: number;
  analysis: number;
  efficiency: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }>;
}

// --- Fin del archivo de tipos --- 