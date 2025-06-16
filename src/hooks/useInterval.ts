/**
 * 🔄 Hook useInterval - AiDuxCare V.2
 * Hook que maneja intervalos con cleanup automático
 * Soluciona el problema de bucles infinitos por intervalos no limpiados
 */

import { useEffect, useRef } from 'react';

/**
 * Hook que crea un intervalo con cleanup automático
 * @param callback Función a ejecutar en cada intervalo
 * @param delay Tiempo en milisegundos entre ejecuciones (null para pausar)
 * @param immediate Si debe ejecutarse inmediatamente
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  immediate = false
): void {
  const savedCallback = useRef<() => void>();

  // Recordar el último callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configurar el intervalo
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    // Ejecutar inmediatamente si se solicita
    if (immediate && delay !== null) {
      tick();
    }

    // Crear el intervalo
    if (delay !== null) {
      const id = setInterval(tick, delay);
      
      // Cleanup automático
      return () => {
        clearInterval(id);
      };
    }
  }, [delay, immediate]);
}

/**
 * Hook que crea un intervalo controlable manualmente
 */
export function useControllableInterval(
  callback: () => void,
  delay: number
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const savedCallback = useRef<() => void>();

  // Recordar el último callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Función para iniciar el intervalo
  const start = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }, delay);
  };

  // Función para detener el intervalo
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Función para verificar si está activo
  const isActive = () => intervalRef.current !== null;

  // Cleanup automático al desmontar
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return { start, stop, isActive };
}

export default useInterval; 