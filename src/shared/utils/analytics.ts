interface AnalyticsEvent {
  eventName: string;
  properties?: Record<string, unknown>;
}

export const track = (eventName: string, properties?: Record<string, unknown>) => {
  const event: AnalyticsEvent = {
    eventName,
    properties
  };

  // En desarrollo, solo logueamos los eventos
  if (import.meta.env.DEV) {
    console.log('Analytics Event:', event);
    return;
  }

  // En producción, aquí iría la implementación real de analytics
  // Por ejemplo, usando Google Analytics, Mixpanel, etc.
  try {
    // Implementación futura
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}; 