/**
 * Test Setup - Polyfills and Global Mocks
 * 
 * Provides WebCrypto and other browser APIs for jsdom environment
 */

import { webcrypto } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'node:util';

// WebCrypto polyfill for jsdom
if (!globalThis.crypto) {
  // @ts-expect-error - assigning webcrypto to global
  globalThis.crypto = webcrypto as any;
}

// Ensure crypto.subtle is available (Node.js webcrypto has it)
if (globalThis.crypto && !globalThis.crypto.subtle) {
  // @ts-expect-error
  globalThis.crypto.subtle = webcrypto.subtle;
}

// Ensure window.crypto exists in jsdom
if (typeof window !== 'undefined' && !window.crypto) {
  // @ts-expect-error
  window.crypto = globalThis.crypto;
}

// Ensure window.crypto.subtle exists
if (typeof window !== 'undefined' && window.crypto && !window.crypto.subtle) {
  // @ts-expect-error
  window.crypto.subtle = globalThis.crypto.subtle;
}

// TextEncoder/TextDecoder polyfill
if (!globalThis.TextEncoder) {
  // @ts-expect-error
  globalThis.TextEncoder = TextEncoder as any;
}

if (!globalThis.TextDecoder) {
  // @ts-expect-error
  globalThis.TextDecoder = TextDecoder as any;
}

// atob/btoa polyfill for base64 encoding/decoding
if (!globalThis.atob) {
  // @ts-expect-error
  globalThis.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

if (!globalThis.btoa) {
  // @ts-expect-error
  globalThis.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

// Ensure window has atob/btoa in jsdom
if (typeof window !== 'undefined') {
  if (!window.atob) {
    // @ts-expect-error
    window.atob = globalThis.atob;
  }
  if (!window.btoa) {
    // @ts-expect-error
    window.btoa = globalThis.btoa;
  }
}

// Setup complete - WebCrypto, TextEncoder/Decoder, and atob/btoa polyfills active

