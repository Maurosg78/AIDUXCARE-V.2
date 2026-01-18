/**
 * Vitest Test Setup
 * 
 * Global setup for all tests
 * 
 * IMPORTANTE: El mock de Firebase debe ir ANTES de cualquier otro import
 * que pueda importar Firebase, para evitar side-effects de inicialización.
 */
/// <reference types="node" />
/// <reference lib="dom" />
/// <reference path="./types/node-handles.d.ts" />
import { vi, afterAll } from 'vitest';
import type { NodeProcess, NodeHandle } from './types/node-handles';

// ✅ PHIPA/PIPEDA compliant: No mocks de Firebase Auth (usa Firebase real)
// Los mocks de Firebase Auth están deshabilitados para permitir tests de integración
// con Firebase real (Emulator o configuración mínima)
// Si necesitas mocks específicos, úsalos en tests individuales

import '@testing-library/jest-dom/vitest';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
  type FirestoreModule = Record<string, unknown>;
  // Use dynamic import as fallback if vi.importActual is not available
  const actual = (await import('firebase/firestore')) as FirestoreModule;
  return {
    ...actual,
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn((...args: unknown[]) => args),
    where: vi.fn((...args: unknown[]) => args),
    orderBy: vi.fn((...args: unknown[]) => args),
    limit: vi.fn((n: number) => n),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
  };
});

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));


// Aggressive cleanup function for MessagePort handles (including volta-shim)
function closeMessagePortHandles(): void {
  try {
    interface NodeHandle {
      constructor?: { name?: string };
      postMessage?: (message: unknown) => void;
      close?: () => void;
      port1?: NodeHandle;
      port2?: NodeHandle;
      onmessage?: ((event: MessageEvent) => void) | null | undefined;
      addEventListener?: (event: string, handler: () => void) => void;
      destroy?: () => void;
      removeAllListeners?: () => void;
      removeEventListener?: (event: string, handler: () => void) => void;
      onmessageerror?: ((event: MessageEvent) => void) | null | undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processWithHandles = process as any as NodeProcess;
    const handles: NodeHandle[] = processWithHandles._getActiveHandles?.() ?? [];
    const messagePortHandles: NodeHandle[] = [];

    for (const handle of handles) {
      // Check if it's a MessagePort-like handle
      const handleName = handle?.constructor?.name || '';

      // More aggressive detection: check for MessagePort characteristics
      if (handle && (
        handleName === 'MessagePort' ||
        handleName === 'MessageChannel' ||
        handleName.includes('MessagePort') ||
        handleName.includes('MessageChannel') ||
        // Check for handles with postMessage method (characteristic of MessagePort)
        (typeof handle.postMessage === 'function' && typeof handle.close === 'function') ||
        // Check for handles with port1/port2 properties (MessageChannel)
        (handle.port1 && handle.port2) ||
        // volta-shim handles might not have obvious names, check for close method and event-like properties
        (typeof handle.close === 'function' && (
          handleName.includes('Port') ||
          handleName.includes('Channel') ||
          handle.onmessage !== undefined ||
          handle.addEventListener !== undefined
        ))
      )) {
        messagePortHandles.push(handle);
      }
    }

    // Close all MessagePort handles aggressively
    for (const handle of messagePortHandles) {
      try {
        // Try multiple cleanup methods
        if (typeof handle.close === 'function') {
          handle.close();
        }
        if (typeof handle.destroy === 'function') {
          handle.destroy();
        }
        // Remove event listeners
        if (typeof handle.removeAllListeners === 'function') {
          handle.removeAllListeners();
        }
        if (typeof handle.removeEventListener === 'function') {
          handle.removeEventListener('message', () => { /* no-op */ });
          handle.removeEventListener('messageerror', () => { /* no-op */ });
        }
        // Clear message handlers
        if (handle.onmessage !== undefined) {
          handle.onmessage = null;
        }
        if (handle.onmessageerror !== undefined) {
          handle.onmessageerror = null;
        }
        // Close ports if it's a MessageChannel
        if (handle.port1 && typeof handle.port1.close === 'function') {
          handle.port1.close();
        }
        if (handle.port2 && typeof handle.port2.close === 'function') {
          handle.port2.close();
        }
      } catch {
        // Ignore errors during cleanup
      }
    }
  } catch {
    // Ignore errors during cleanup
  }
}

// Cleanup after all tests (runs in test worker process)
afterAll(() => {
  closeMessagePortHandles();
});

// Also cleanup on process exit (critical for volta-shim handles)
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', () => {
    closeMessagePortHandles();
  });

  process.on('exit', () => {
    closeMessagePortHandles();
  });
}
