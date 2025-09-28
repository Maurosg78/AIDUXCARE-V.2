// @ts-nocheck
import logger from '@/shared/utils/logger';
/**
 * 🔍 AiDuxCare - Remote Monitoring Service
 * Servicio de monitoreo remoto que envía datos de la interfaz a supervisión externa
 * Permite al asistente ver en tiempo real el estado de la aplicación
 */

// Interfaces para tipos específicos
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

interface ExtendedWindow extends Window {
  firebase?: {
    auth?: unknown;
    firestore?: unknown;
    storage?: unknown;
  };
  html2canvas?: (element: HTMLElement) => Promise<HTMLCanvasElement>;
  remoteMonitoring?: RemoteMonitoringService;
}

export interface RemoteMonitoringEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  url: string;
  userAgent: string;
  type: 'error' | 'warning' | 'info' | 'success' | 'debug';
  category: 'auth' | 'firebase' | 'network' | 'ui' | 'performance' | 'api' | 'system';
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
  screenshot?: string; // Base64 screenshot si es crítico
}

export interface RemoteSystemStatus {
  timestamp: string;
  sessionId: string;
  url: string;
  firebase: {
    auth: boolean;
    firestore: boolean;
    storage: boolean;
    errors: string[];
  };
  network: {
    connectivity: boolean;
    latency: number;
    errors: number;
    failedRequests: string[];
  };
  performance: {
    loadTime: number;
    memoryUsage: number;
    errors: number;
    warnings: number;
  };
  user: {
    authenticated: boolean;
    role?: string;
    sessionDuration: number;
    lastActivity: string;
  };
  ui: {
    currentPage: string;
    elementsLoaded: number;
    errors: string[];
    warnings: string[];
  };
}

class RemoteMonitoringService {
  private sessionId: string;
  private startTime: Date;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 segundos
  private eventQueue: RemoteMonitoringEvent[] = [];
  private statusInterval: ReturnType<typeof setTimeout> | null = null;
  private endpoint: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.endpoint = this.getMonitoringEndpoint();
    this.initializeRemoteMonitoring();
  }

  /**
   * Obtiene el endpoint de monitoreo
   */
  private getMonitoringEndpoint(): string {
    // Endpoint para envío de datos de monitoreo
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001/api/monitoring' // Servidor local de monitoreo
      : 'https://aiduxcare-monitoring.vercel.app/api/monitoring'; // Endpoint de producción
  }

  /**
   * Inicializa el monitoreo remoto
   */
  private initializeRemoteMonitoring(): void {
    // Verificar conectividad
    this.checkConnectivity();
    
    // Enviar estado inicial
    this.sendInitialStatus();
    
    // Configurar envío periódico de estado
    this.startStatusReporting();
    
    // Interceptar errores críticos
    this.interceptCriticalErrors();
    
    // Monitorear cambios de página
    this.monitorPageChanges();
    
    // Monitorear performance
    this.monitorPerformance();
  }

  /**
   * Verifica conectividad con el servidor de monitoreo
   */
  private async checkConnectivity(): Promise<void> {
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.isConnected = response.ok;
      
      if (this.isConnected) {
        this.log('info', 'system', 'Conectado al servidor de monitoreo remoto');
        this.reconnectAttempts = 0;
        this.processEventQueue();
      } else {
        this.log('warning', 'system', 'Servidor de monitoreo no disponible');
      }
    } catch (error) {
      this.isConnected = false;
      this.log('error', 'system', 'Error conectando al servidor de monitoreo', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.scheduleReconnect();
    }
  }

  /**
   * Programa reconexión automática
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.log('info', 'system', `Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.checkConnectivity();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      this.log('error', 'system', 'Máximo de intentos de reconexión alcanzado');
    }
  }

  /**
   * Envía estado inicial del sistema
   */
  private async sendInitialStatus(): Promise<void> {
    const status = this.getSystemStatus();
    await this.sendToServer('/status', status);
  }

  /**
   * Inicia reporte periódico de estado
   */
  private startStatusReporting(): void {
    this.statusInterval = setInterval(async () => {
      const status = this.getSystemStatus();
      await this.sendToServer('/status', status);
    }, 10000); // Cada 10 segundos
  }

  /**
   * Intercepta errores críticos para envío inmediato
   */
  private interceptCriticalErrors(): void {
    // Interceptar errores de Firebase
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Protección contra bucles infinitos - NO registrar errores del propio monitoreo
      if (message.includes('[REMOTE MONITORING]') || 
          message.includes('RemoteMonitoringService') ||
          message.includes('monitoring')) {
        originalConsoleError.apply(console, args);
        return;
      }
      
      // Solo registrar errores de Firebase específicos
      if (message.includes('Firebase') && !message.includes('[REMOTE MONITORING]')) {
        this.log('error', 'firebase', message, { 
          stack: new Error().stack,
          critical: true 
        });
      } else if (message.includes('auth/invalid-credential')) {
        this.log('error', 'auth', 'Credenciales inválidas detectadas', {
          error: message,
          critical: true
        });
      }
      
      // Llamar al console.error original
      originalConsoleError.apply(console, args);
    };

    // Interceptar errores de red
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
          this.log('error', 'network', `Error HTTP ${response.status}`, {
            url,
            status: response.status,
            statusText: response.statusText,
            duration,
            critical: response.status >= 500
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.log('error', 'network', 'Error de red crítico', {
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
          critical: true
        });
        throw error;
      }
    };
  }

  /**
   * Monitorea cambios de página
   */
  private monitorPageChanges(): void {
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        this.log('info', 'ui', 'Navegación de página', {
          from: currentUrl,
          to: window.location.href,
          timestamp: new Date().toISOString()
        });
        currentUrl = window.location.href;
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Monitorea performance del sistema
   */
  private monitorPerformance(): void {
    // Monitorear carga de página
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      const extendedPerformance = performance as ExtendedPerformance;
      this.log('info', 'performance', `Página cargada`, {
        loadTime,
        memoryUsage: extendedPerformance.memory?.usedJSHeapSize,
        url: window.location.href
      });
    });

    // Monitorear memoria cada 30 segundos
    setInterval(() => {
      const extendedPerformance = performance as ExtendedPerformance;
      if (extendedPerformance.memory) {
        const memory = extendedPerformance.memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          this.log('warning', 'performance', 'Uso alto de memoria', {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          });
        }
      }
    }, 30000);
  }

  /**
   * Registra un evento de monitoreo remoto
   */
  log(
    type: RemoteMonitoringEvent['type'],
    category: RemoteMonitoringEvent['category'],
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: RemoteMonitoringEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      type,
      category,
      message,
      details,
      stack: details?.stack as string
    };

    // Agregar a cola de eventos
    this.eventQueue.push(event);

    // Si es crítico, enviar inmediatamente
    if (details?.critical || type === 'error') {
      this.sendEventImmediately(event);
    }

    // Log local para debugging
    const logMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
    console[logMethod](`[REMOTE MONITORING] ${category.toUpperCase()}: ${message}`, details);
  }

  /**
   * Envía evento crítico inmediatamente
   */
  private async sendEventImmediately(event: RemoteMonitoringEvent): Promise<void> {
    if (this.isConnected) {
      await this.sendToServer('/events', event);
    } else {
      // Si no está conectado, agregar a cola
      this.eventQueue.push(event);
    }
  }

  /**
   * Procesa la cola de eventos pendientes
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendToServer('/events/batch', { events });
    } catch (error) {
      // Si falla, volver a agregar a la cola
      this.eventQueue.unshift(...events);
      console.warn('Error enviando eventos en lote:', error);
    }
  }

  /**
   * Obtiene el estado completo del sistema
   */
  getSystemStatus(): RemoteSystemStatus {
    const uptime = Date.now() - this.startTime.getTime();
    const extendedPerformance = performance as ExtendedPerformance;
    
    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: window.location.href,
      firebase: {
        auth: this.checkFirebaseAuth(),
        firestore: this.checkFirestore(),
        storage: this.checkFirebaseStorage(),
        errors: this.getFirebaseErrors()
      },
      network: {
        connectivity: navigator.onLine,
        latency: this.calculateAverageLatency(),
        errors: this.getNetworkErrorCount(),
        failedRequests: this.getFailedRequests()
      },
      performance: {
        loadTime: performance.now(),
        memoryUsage: extendedPerformance.memory?.usedJSHeapSize || 0,
        errors: this.getErrorCount(),
        warnings: this.getWarningCount()
      },
      user: {
        authenticated: this.checkUserAuthentication(),
        role: this.getUserRole(),
        sessionDuration: uptime,
        lastActivity: new Date().toISOString()
      },
      ui: {
        currentPage: window.location.pathname,
        elementsLoaded: document.querySelectorAll('*').length,
        errors: this.getUIErrors(),
        warnings: this.getUIWarnings()
      }
    };
  }

  /**
   * Envía datos al servidor de monitoreo
   */
  private async sendToServer(path: string, data: unknown): Promise<void> {
    if (!this.isConnected) return;

    try {
      const payload = typeof data === 'object' && data !== null 
        ? { ...data as Record<string, unknown>, sessionId: this.sessionId, timestamp: new Date().toISOString() }
        : { data, sessionId: this.sessionId, timestamp: new Date().toISOString() };

      const response = await fetch(`${this.endpoint}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Error enviando datos de monitoreo:', error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Captura screenshot de la página (solo para errores críticos)
   */
  async captureScreenshot(): Promise<string | null> {
    try {
      // Usar html2canvas si está disponible
      const extendedWindow = window as ExtendedWindow;
      if (typeof extendedWindow.html2canvas !== 'undefined') {
        const html2canvas = extendedWindow.html2canvas;
        const canvas = await html2canvas(document.body);
        return canvas.toDataURL('image/png');
      }
      
      // Fallback: intentar con la API nativa (limitada)
      return null;
    } catch (error) {
      console.warn('Error capturando screenshot:', error);
      return null;
    }
  }

  /**
   * Envía reporte de error crítico con screenshot
   */
  async sendCriticalErrorReport(error: Error, context?: Record<string, unknown>): Promise<void> {
    const screenshot = await this.captureScreenshot();
    
    this.log('error', 'system', 'Error crítico detectado', {
      error: error.message,
      stack: error.stack,
      context,
      screenshot,
      critical: true
    });
  }

  // Métodos de verificación privados
  private checkFirebaseAuth(): boolean {
    try {
      const extendedWindow = window as ExtendedWindow;
      return typeof window !== 'undefined' && 
             extendedWindow.firebase?.auth !== undefined;
    } catch {
      return false;
    }
  }

  private checkFirestore(): boolean {
    try {
      const extendedWindow = window as ExtendedWindow;
      return typeof window !== 'undefined' && 
             extendedWindow.firebase?.firestore !== undefined;
    } catch {
      return false;
    }
  }

  private checkFirebaseStorage(): boolean {
    try {
      const extendedWindow = window as ExtendedWindow;
      return typeof window !== 'undefined' && 
             extendedWindow.firebase?.storage !== undefined;
    } catch {
      return false;
    }
  }

  private checkUserAuthentication(): boolean {
    try {
      return localStorage.getItem('user') !== null || 
             sessionStorage.getItem('user') !== null;
    } catch {
      return false;
    }
  }

  private getUserRole(): string | undefined {
    try {
      const user = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.role;
      }
    } catch {
      return undefined;
    }
  }

  private getFirebaseErrors(): string[] {
    return this.eventQueue
      .filter(e => e.category === 'firebase' && e.type === 'error')
      .map(e => e.message)
      .slice(-5); // Últimos 5 errores
  }

  private getNetworkErrorCount(): number {
    return this.eventQueue.filter(e => e.category === 'network' && e.type === 'error').length;
  }

  private getFailedRequests(): string[] {
    return this.eventQueue
      .filter(e => e.category === 'network' && e.type === 'error')
      .map(e => e.details?.url as string)
      .filter(Boolean)
      .slice(-10); // Últimas 10 URLs fallidas
  }

  private getErrorCount(): number {
    return this.eventQueue.filter(e => e.type === 'error').length;
  }

  private getWarningCount(): number {
    return this.eventQueue.filter(e => e.type === 'warning').length;
  }

  private getUIErrors(): string[] {
    return this.eventQueue
      .filter(e => e.category === 'ui' && e.type === 'error')
      .map(e => e.message)
      .slice(-5);
  }

  private getUIWarnings(): string[] {
    return this.eventQueue
      .filter(e => e.category === 'ui' && e.type === 'warning')
      .map(e => e.message)
      .slice(-5);
  }

  private calculateAverageLatency(): number {
    const networkEvents = this.eventQueue.filter(e => e.category === 'network' && e.details?.duration);
    if (networkEvents.length === 0) return 0;
    
    const totalDuration = networkEvents.reduce((sum, e) => sum + (e.details?.duration as number), 0);
    return totalDuration / networkEvents.length;
  }

  private generateSessionId(): string {
    return `remote_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `remote_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpia recursos al destruir
   */
  destroy(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }
}

// Instancia singleton
export const remoteMonitoring = new RemoteMonitoringService();

// Exportar para uso global
if (typeof window !== 'undefined') {
  (window as ExtendedWindow).remoteMonitoring = remoteMonitoring;
} 