import { vi } from 'vitest';
import '@testing-library/jest-dom';

globalThis.vi = vi;
globalThis.fetch = globalThis.fetch || (() => Promise.resolve({ json: () => ({}) }));

export {};
