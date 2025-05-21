import { useState, useEffect } from 'react';

type Subscribe = (callback: () => void) => () => void;
type GetSnapshot<T> = () => T;
type Selector<T, R> = (state: T) => R;
type EqualityFn<T> = (a: T, b: T) => boolean;

/**
 * Mock de useSyncExternalStore para testing
 * Implementa la funcionalidad básica del hook real
 */
export function useSyncExternalStore<T>(
  subscribe: Subscribe,
  getSnapshot: GetSnapshot<T>,
  // getServerSnapshot es opcional y no se usa en el mock
  _getServerSnapshot?: GetSnapshot<T>
): T {
  const [snapshot, setSnapshot] = useState<T>(getSnapshot());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setSnapshot(getSnapshot());
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, getSnapshot]);

  return snapshot;
}

/**
 * Mock de useSyncExternalStoreWithSelector para testing
 * Implementa una versión simplificada del hook real
 */
export const useSyncExternalStoreWithSelector = <T, R>(
  subscribe: Subscribe,
  getSnapshot: GetSnapshot<T>,
  // getServerSnapshot es requerido por la API pero no se usa en el mock
  _getServerSnapshot: GetSnapshot<T>,
  selector: Selector<T, R>,
  // isEqual es opcional y no se usa en el mock
  _isEqual?: EqualityFn<R>
): R => {
  return selector(getSnapshot());
};

export default {
  useSyncExternalStore,
  useSyncExternalStoreWithSelector
}; 