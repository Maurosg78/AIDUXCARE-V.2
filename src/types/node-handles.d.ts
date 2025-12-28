/// <reference types="node" />
/// <reference lib="dom" />

/**
 * Type definitions for Node.js internal handle inspection
 * Used for debugging and cleanup in test environments
 */

export interface NodeHandle {
  constructor?: {
    name?: string;
  };
  pid?: number;
  fd?: number;
  hasRef?: () => boolean;
  close?: () => void;
  destroy?: () => void;
  removeAllListeners?: () => void;
  removeEventListener?: (event: string, handler: () => void) => void;
  postMessage?: (message: unknown) => void;
  onmessage?: ((event: MessageEvent) => void) | null;
  onmessageerror?: ((event: MessageEvent) => void) | null;
  port1?: NodeHandle;
  port2?: NodeHandle;
  addEventListener?: (event: string, handler: () => void) => void;
}

export interface NodeProcess extends NodeJS.Process {
  _getActiveHandles?: () => NodeHandle[];
  _getActiveRequests?: () => unknown[];
}

declare global {
  const process: NodeProcess;
  const console: Console;
  const window: Window & typeof globalThis;
  const setTimeout: typeof globalThis.setTimeout;
  const Date: DateConstructor;
  const Record: typeof globalThis.Record;
  const MessageEvent: typeof globalThis.MessageEvent;
  
  // ReturnType is a built-in TypeScript utility type, no need to declare it
  // It's available globally in TypeScript
}

