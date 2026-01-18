import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

const __originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = String(args?.[0] ?? "");
  if (msg.includes("React Router Future Flag Warning")) return;
  __originalWarn(...args);
};


const dbs = new Set<any>();

// ✅ PHIPA/PIPEDA compliant: No mock de Firebase (usa Firebase real)
// Firebase se inicializa en test/setupTests.ts antes de este setup

afterEach(() => cleanup());

