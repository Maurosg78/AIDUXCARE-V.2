/**
 * 🚀 TELEMETRÍA EMPRESARIAL AIDUXCARE 24/7
 * 
 * Hook para capturar eventos automáticamente del flujo de la sesión
 * - Tiempo viendo banner del paciente
 * - Clicks en información del paciente  
 * - Tipo de paciente (nuevo vs antiguo)
 * - Interacción con alertas (confirmar/descartar)
 * - Todo el flujo de la sesión
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  eventType: string;
  eventData: Record<string, any>;
  sessionId: string;
  userId?: string;
  patientId?: string;
}

export interface PatientInteraction {
  patientId: string;
  isNewPatient: boolean;
  bannerViewTime: number;
  clicksOnPatientInfo: number;
  alertInteractions: {
    confirmed: number;
    dismissed: number;
    saved: number;
  };
  sessionDuration: number;
}

export interface TelemetryConfig {
  enabled: boolean;
  sessionId: string;
  userId?: string;
  patientId?: string;
  autoSend: boolean;
  batchSize: number;
  flushInterval: number;
}

const useAiDuxTelemetry = (config: Partial<TelemetryConfig> = {}) => {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const sessionStartTime = useRef<number>(Date.now());
  const bannerViewStartTime = useRef<number | null>(null);
  const patientInteraction = useRef<PatientInteraction>({
    patientId: '',
    isNewPatient: false,
    bannerViewTime: 0,
    clicksOnPatientInfo: 0,
    alertInteractions: {
      confirmed: 0,
      dismissed: 0,
      saved: 0
    },
    sessionDuration: 0
  });

  const defaultConfig: TelemetryConfig = {
    enabled: true,
    sessionId: `session_${Date.now()}`,
    autoSend: true,
    batchSize: 10,
    flushInterval: 30000, // 30 segundos
    ...config
  };

  /**
   * Capturar evento de telemetría
   */
  const captureEvent = useCallback((
    eventType: string, 
    eventData: Record<string, any> = {}
  ) => {
    if (!defaultConfig.enabled) return;

    const event: TelemetryEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType,
      eventData: {
        ...eventData,
        sessionDuration: Date.now() - sessionStartTime.current
      },
      sessionId: defaultConfig.sessionId,
      userId: defaultConfig.userId,
      patientId: defaultConfig.patientId
    };

    setEvents(prev => [...prev, event]);

    // Log para debugging
    console.log('📊 TELEMETRÍA:', {
      eventType,
      eventData,
      sessionDuration: `${Math.round((Date.now() - sessionStartTime.current) / 1000)}s`
    });

    // Auto-send si está habilitado
    if (defaultConfig.autoSend && events.length >= defaultConfig.batchSize) {
      flushEvents();
    }
  }, [defaultConfig, events.length]);

  /**
   * Iniciar tracking de banner del paciente
   */
  const startBannerTracking = useCallback((patientId: string, isNewPatient: boolean) => {
    bannerViewStartTime.current = Date.now();
    patientInteraction.current = {
      ...patientInteraction.current,
      patientId,
      isNewPatient
    };
    
    captureEvent('banner_view_start', {
      patientId,
      isNewPatient,
      timestamp: Date.now()
    });
  }, [captureEvent]);

  /**
   * Finalizar tracking de banner del paciente
   */
  const stopBannerTracking = useCallback(() => {
    if (bannerViewStartTime.current) {
      const viewTime = Date.now() - bannerViewStartTime.current;
      patientInteraction.current.bannerViewTime = viewTime;
      
      captureEvent('banner_view_end', {
        patientId: patientInteraction.current.patientId,
        viewTime,
        isNewPatient: patientInteraction.current.isNewPatient
      });
      
      bannerViewStartTime.current = null;
    }
  }, [captureEvent]);

  /**
   * Capturar click en información del paciente
   */
  const capturePatientInfoClick = useCallback((infoType: string, value: string) => {
    patientInteraction.current.clicksOnPatientInfo++;
    
    captureEvent('patient_info_click', {
      infoType,
      value,
      totalClicks: patientInteraction.current.clicksOnPatientInfo
    });
  }, [captureEvent]);

  /**
   * Capturar interacción con alerta
   */
  const captureAlertInteraction = useCallback((
    alertId: string, 
    action: 'confirm' | 'dismiss' | 'save',
    alertData: Record<string, any>
  ) => {
    switch (action) {
      case 'confirm':
        patientInteraction.current.alertInteractions.confirmed++;
        break;
      case 'dismiss':
        patientInteraction.current.alertInteractions.dismissed++;
        break;
      case 'save':
        patientInteraction.current.alertInteractions.saved++;
        break;
    }

    captureEvent('alert_interaction', {
      alertId,
      action,
      alertData,
      totalConfirmed: patientInteraction.current.alertInteractions.confirmed,
      totalDismissed: patientInteraction.current.alertInteractions.dismissed,
      totalSaved: patientInteraction.current.alertInteractions.saved
    });
  }, [captureEvent]);

  /**
   * Capturar inicio de grabación
   */
  const captureRecordingStart = useCallback(() => {
    captureEvent('recording_start', {
      timestamp: Date.now()
    });
  }, [captureEvent]);

  /**
   * Capturar fin de grabación
   */
  const captureRecordingEnd = useCallback((duration: number, transcriptionLength: number) => {
    captureEvent('recording_end', {
      duration,
      transcriptionLength,
      timestamp: Date.now()
    });
  }, [captureEvent]);

  /**
   * Capturar navegación entre pestañas
   */
  const captureTabNavigation = useCallback((fromTab: number, toTab: number) => {
    captureEvent('tab_navigation', {
      fromTab,
      toTab,
      timestamp: Date.now()
    });
  }, [captureEvent]);

  /**
   * Enviar eventos al servidor
   */
  const flushEvents = useCallback(async () => {
    if (events.length === 0) return;

    try {
      // Simular envío al servidor
      console.log('📤 Enviando telemetría al servidor:', events.length, 'eventos');
      
      // Aquí iría la llamada real al servidor
      // await fetch('/api/telemetry', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events })
      // });

      // Limpiar eventos enviados
      setEvents([]);
      
    } catch (error) {
      console.error('❌ Error enviando telemetría:', error);
    }
  }, [events]);

  /**
   * Obtener métricas de la sesión
   */
  const getSessionMetrics = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartTime.current;
    
    return {
      sessionId: defaultConfig.sessionId,
      sessionDuration,
      totalEvents: events.length,
      patientInteraction: patientInteraction.current,
      eventsByType: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [events, defaultConfig.sessionId]);

  /**
   * Iniciar tracking automático
   */
  const startTracking = useCallback(() => {
    setIsTracking(true);
    sessionStartTime.current = Date.now();
    
    captureEvent('session_start', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`
    });
  }, [captureEvent]);

  /**
   * Detener tracking y enviar datos finales
   */
  const stopTracking = useCallback(async () => {
    setIsTracking(false);
    
    // Finalizar tracking de banner si está activo
    if (bannerViewStartTime.current) {
      stopBannerTracking();
    }
    
    // Capturar fin de sesión
    captureEvent('session_end', {
      timestamp: Date.now(),
      totalSessionDuration: Date.now() - sessionStartTime.current
    });
    
    // Enviar todos los eventos pendientes
    await flushEvents();
  }, [captureEvent, stopBannerTracking, flushEvents]);

  // Auto-flush cada cierto tiempo
  useEffect(() => {
    if (!defaultConfig.autoSend) return;

    const interval = setInterval(() => {
      if (events.length > 0) {
        flushEvents();
      }
    }, defaultConfig.flushInterval);

    return () => clearInterval(interval);
  }, [defaultConfig.autoSend, defaultConfig.flushInterval, events.length, flushEvents]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);

  return {
    // Métodos principales
    captureEvent,
    startBannerTracking,
    stopBannerTracking,
    capturePatientInfoClick,
    captureAlertInteraction,
    captureRecordingStart,
    captureRecordingEnd,
    captureTabNavigation,
    startTracking,
    stopTracking,
    flushEvents,
    
    // Estado y métricas
    isTracking,
    events,
    getSessionMetrics,
    
    // Configuración
    config: defaultConfig
  };
};

export default useAiDuxTelemetry;