/**
 * @fileoverview Test Setup for AiDuxCare V.2
 * @version 2.0.0
 * @author AiDuxCare Development Team
 */

import '@testing-library/jest-dom';

// Extend expect with custom matchers
declare global {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveClass(className: string): R;
    toHaveAttribute(attr: string, value?: string): R;
  }
  
  // Declaraciones para Node.js en entorno de testing
  declare const global: typeof globalThis;
  declare const process: {
    env: { NODE_ENV: string };
    exit: (code: number) => never;
  };
declare const require: NodeRequire;
  declare const module: { exports: unknown; main?: boolean };
  declare const __dirname: string;
  declare const __filename: string;
}

// Mock performance.now if not available in test environment
if (typeof global !== 'undefined' && !global.performance) {
  global.performance = {
    now: () => Date.now()
  } as Performance;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
};

export {};
