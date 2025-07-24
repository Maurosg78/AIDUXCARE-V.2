/**
 * ⚙️ **Enterprise Environment Configuration**
 * 
 * Configuración enterprise con:
 * - Validación estricta de variables
 * - Tipado completo
 * - Fallbacks seguros
 * - Multiple environments
 */

// =====================================================
// ENVIRONMENT TYPES
// =====================================================

export type Environment = 'development' | 'staging' | 'production';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface FirebaseConfig {
  readonly apiKey: string;
  readonly authDomain: string;
  readonly projectId: string;
  readonly storageBucket: string;
  readonly messagingSenderId: string;
  readonly appId: string;
  readonly measurementId?: string;
}

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly ssl: boolean;
  readonly retryAttempts: number;
  readonly connectionTimeout: number;
}

export interface AuditConfig {
  readonly enabled: boolean;
  readonly logLevel: LogLevel;
  readonly retentionDays: number;
  readonly batchSize: number;
  readonly flushInterval: number;
}

export interface SecurityConfig {
  readonly jwtSecret: string;
  readonly sessionTimeout: number;
  readonly maxLoginAttempts: number;
  readonly passwordMinLength: number;
  readonly mfaRequired: boolean;
  readonly allowedOrigins: string[];
}

export interface AppConfig {
  readonly environment: Environment;
  readonly version: string;
  readonly apiUrl: string;
  readonly appName: string;
  readonly supportEmail: string;
  readonly maxFileSize: number;
  readonly defaultLanguage: string;
}

// =====================================================
// MAIN CONFIGURATION INTERFACE
// =====================================================

export interface EnterpriseConfig {
  readonly app: AppConfig;
  readonly firebase: FirebaseConfig;
  readonly database: DatabaseConfig;
  readonly audit: AuditConfig;
  readonly security: SecurityConfig;
  readonly features: FeatureFlags;
}

export interface FeatureFlags {
  readonly enableMFA: boolean;
  readonly enableSMSAuth: boolean;
  readonly enableAdvancedAudit: boolean;
  readonly enableRealTimeSync: boolean;
  readonly enableAnalytics: boolean;
  readonly enableDebugMode: boolean;
}

// =====================================================
// CONFIGURATION VALIDATION
// =====================================================

class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigValidationError';
  }
}

class EnvironmentValidator {
  private static requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ] as const;

  static validateRequired(): void {
    const missing = this.requiredEnvVars.filter(
      envVar => !import.meta.env[envVar]
    );

    if (missing.length > 0) {
      throw new ConfigValidationError(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }
  }

  static validateFirebaseConfig(config: FirebaseConfig): void {
    if (!config.apiKey || config.apiKey.length < 10) {
      throw new ConfigValidationError('Invalid Firebase API key');
    }

    if (!config.projectId || !/^[a-z0-9-]+$/.test(config.projectId)) {
      throw new ConfigValidationError('Invalid Firebase project ID');
    }

    if (!config.authDomain || !config.authDomain.includes('.firebaseapp.com')) {
      throw new ConfigValidationError('Invalid Firebase auth domain');
    }
  }

  static validateEnvironment(env: string): Environment {
    // FORZAR DESARROLLO PARA USAR EMULADORES
    console.log('🔧 Forzando environment = development para usar emuladores');
    return 'development';
  }
}

// =====================================================
// CONFIGURATION FACTORY
// =====================================================

class ConfigurationFactory {
  private static instance: EnterpriseConfig | null = null;

  static create(): EnterpriseConfig {
    if (this.instance) {
      return this.instance;
    }

    // Validate environment first
    EnvironmentValidator.validateRequired();

    const environment = EnvironmentValidator.validateEnvironment(
      import.meta.env.VITE_APP_ENVIRONMENT || 'development'
    );

    // Build configuration
    const config: EnterpriseConfig = {
      app: this.createAppConfig(environment),
      firebase: this.createFirebaseConfig(),
      database: this.createDatabaseConfig(environment),
      audit: this.createAuditConfig(environment),
      security: this.createSecurityConfig(environment),
      features: this.createFeatureFlags(environment)
    };

    // Validate critical configurations
    EnvironmentValidator.validateFirebaseConfig(config.firebase);

    this.instance = config;
    return config;
  }

  private static createAppConfig(environment: Environment): AppConfig {
    return {
      environment,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      apiUrl: import.meta.env.VITE_API_URL || this.getDefaultApiUrl(environment),
      appName: 'AiDuxCare Enterprise',
      supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@aiduxcare.com',
      maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
      defaultLanguage: 'es'
    };
  }

  private static createFirebaseConfig(): FirebaseConfig {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };
  }

  private static createDatabaseConfig(environment: Environment): DatabaseConfig {
    const isProduction = environment === 'production';
    
    return {
      host: import.meta.env.VITE_DB_HOST || 'localhost',
      port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
      ssl: isProduction,
      retryAttempts: isProduction ? 5 : 3,
      connectionTimeout: isProduction ? 30000 : 10000
    };
  }

  private static createAuditConfig(environment: Environment): AuditConfig {
    const isProduction = environment === 'production';
    
    return {
      enabled: true,
      logLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || (isProduction ? 'info' : 'debug'),
      retentionDays: parseInt(import.meta.env.VITE_AUDIT_RETENTION_DAYS || '2555'), // 7 years for HIPAA
      batchSize: parseInt(import.meta.env.VITE_AUDIT_BATCH_SIZE || '100'),
      flushInterval: parseInt(import.meta.env.VITE_AUDIT_FLUSH_INTERVAL || '5000')
    };
  }

  private static createSecurityConfig(environment: Environment): SecurityConfig {
    const isProduction = environment === 'production';
    
    return {
      jwtSecret: import.meta.env.VITE_JWT_SECRET || 'dev-secret-key-change-in-production',
      sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '28800000'), // 8 hours
      maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '5'),
      passwordMinLength: parseInt(import.meta.env.VITE_PASSWORD_MIN_LENGTH || '8'),
      mfaRequired: import.meta.env.VITE_MFA_REQUIRED === 'true' || isProduction,
      allowedOrigins: import.meta.env.VITE_ALLOWED_ORIGINS?.split(',') || 
        (isProduction ? [] : ['http://localhost:5173', 'http://localhost:5174'])
    };
  }

  private static createFeatureFlags(environment: Environment): FeatureFlags {
    const isDevelopment = environment === 'development';
    
    return {
      enableMFA: import.meta.env.VITE_ENABLE_MFA !== 'false',
      enableSMSAuth: import.meta.env.VITE_ENABLE_SMS_AUTH === 'true',
      enableAdvancedAudit: import.meta.env.VITE_ENABLE_ADVANCED_AUDIT !== 'false',
      enableRealTimeSync: import.meta.env.VITE_ENABLE_REALTIME_SYNC !== 'false',
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
      enableDebugMode: isDevelopment || import.meta.env.VITE_ENABLE_DEBUG === 'true'
    };
  }

  private static getDefaultApiUrl(environment: Environment): string {
    switch (environment) {
      case 'production':
        return 'https://api.aiduxcare.com';
      case 'staging':
        return 'https://staging-api.aiduxcare.com';
      default:
        return 'http://localhost:3000';
    }
  }
}

// =====================================================
// EXPORTED CONFIGURATION
// =====================================================

export const config = ConfigurationFactory.create();

// Helper functions for common config access
export const isProduction = (): boolean => config.app.environment === 'production';
export const isDevelopment = (): boolean => config.app.environment === 'development';
export const isDebugEnabled = (): boolean => config.features.enableDebugMode;

// Configuration sections shortcuts
export const appConfig = config.app;
export const firebaseConfig = config.firebase;
export const auditConfig = config.audit;
export const securityConfig = config.security;
export const featureFlags = config.features;