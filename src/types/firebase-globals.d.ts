/// <reference types="node" />

// Global type declarations for Node.js globals in browser context
declare const process: {
  env: {
    [key: string]: string | undefined;
    VITEST?: string;
  };
} | undefined;

// Ensure DOM types are available
declare global {
  interface Window {
    localStorage: Storage;
    indexedDB?: IDBFactory;
  }
  
  const console: Console;
}

export {};

