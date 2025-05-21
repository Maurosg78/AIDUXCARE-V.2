// src/lib/use-sync-external-store-mock.ts
import { useState, useEffect } from 'react';

type Subscribe = (callback: () => void) => () => void;
type GetSnapshot<T> = () => T;
type Selector<T, R> = (state: T) => R;

/**
 * Mock of React's useSyncExternalStore for testing.
 * Implements the basic subscription + snapshot behaviour.
 */
export function useSyncExternalStoreMock<T>(
  subscribe: Subscribe,
  getSnapshot: GetSnapshot<T>
): T {
  const [snapshot, setSnapshot] = useState<T>(getSnapshot());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setSnapshot(getSnapshot());
    });
    return unsubscribe;
  }, [subscribe, getSnapshot]);

  return snapshot;
}

/**
 * Mock of useSyncExternalStoreWithSelector for testing.
 * A simplified selector-based version.
 */
export function useSyncExternalStoreWithSelectorMock<T, R>(
  subscribe: Subscribe,
  getSnapshot: GetSnapshot<T>,
  selector: Selector<T, R>
): R {
  // Always derive from a fresh snapshot
  return selector(getSnapshot());
}

export default {
  useSyncExternalStore: useSyncExternalStoreMock,
  useSyncExternalStoreWithSelector: useSyncExternalStoreWithSelectorMock,
};
 