/**
 * Servicio de analytics para tracking de eventos
 */

interface TrackEvent {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Registra un evento de analytics
 * @param eventName Nombre del evento
 * @param properties Propiedades adicionales del evento
 */
export const track = (eventName: string, properties?: TrackEvent): void => {
  // En desarrollo, solo logueamos los eventos
  if (import.meta.env.DEV) {
    console.log("📊 Analytics Event:", eventName, properties);
    return;
  }

  // TODO: Implementar integración real con servicio de analytics
  // Por ahora es un stub
};
