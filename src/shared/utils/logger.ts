/* Simple wrapper para centralizar logs */
type LV = 'log'|'info'|'warn'|'error'|'debug';
const emit = (level: LV, args: unknown[]) => {
  // En prod podrías enviar a Sentry/Datadog, etc.
  // Por ahora imprime a consola para no cambiar la semántica
  // eslint-disable-next-line no-console
  (console as any)[level](...args);
};
const logger = {
  log:   (...args: unknown[]) => emit('log', args),
  info:  (...args: unknown[]) => emit('info', args),
  warn:  (...args: unknown[]) => emit('warn', args),
  error: (...args: unknown[]) => emit('error', args),
  debug: (...args: unknown[]) => emit('debug', args),
};
export default logger;
