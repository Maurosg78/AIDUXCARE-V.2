// Clinical-grade structured logging

interface LogEntry {
  timestamp: string;
  level: string;
  event: string;
  data?: any;
}

class ClinicalLogger {
  private environment: string;
  
  constructor() {
    this.environment = import.meta.env.VITE_ENV || 'development';
  }
  
  private sanitize(data: any): any {
    // Remove PII
    const sanitized = { ...data };
    ['name', 'email', 'phone'].forEach(field => {
      if (sanitized[field]) sanitized[field] = '[REDACTED]';
    });
    return sanitized;
  }
  
  info(event: string, data?: any): void {
    console.log('[AIDUXCARE]', {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event,
      data: data ? this.sanitize(data) : undefined
    });
  }
  
  error(event: string, error: Error, data?: any): void {
    console.error('[AIDUXCARE]', {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      event,
      error: error.message,
      data: data ? this.sanitize(data) : undefined
    });
  }
  
  clinical(event: string, promptVersion: string, data?: any): void {
    this.info(`clinical.${event}`, { promptVersion, ...data });
  }
}

export const logger = new ClinicalLogger();
