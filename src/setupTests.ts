import "@testing-library/jest-dom";
import { vi, expect, beforeAll, afterEach } from "vitest";

// Extender la interfaz global en lugar de declarar variables
interface GlobalThis {
  expect: typeof expect;
  vi: typeof vi;
}

(globalThis as any).expect = expect;
(globalThis as any).vi = vi;

const mockCrypto = {
  getRandomValues: (arr: Uint8Array | Uint16Array | Uint32Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  randomUUID: () => "mock-uuid-" + Math.random().toString(36).substring(2, 15)
};

Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
  configurable: true
}); 