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
