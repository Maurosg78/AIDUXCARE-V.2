/**
 * CRITICAL: MessagePort mocks must be loaded FIRST, before any other setup.
 * This file is loaded before test-setup.ts to intercept volta-shim and other early loaders.
 * 
 * volta-shim creates MessagePort handles when npx is executed, so we need to mock
 * MessagePort/MessageChannel at the earliest possible moment.
 */

// Mock MessagePort/MessageChannel BEFORE any imports that might use them
if (!(globalThis as any).__AIDUX_TEST_PORT_MOCKS__) {
  (globalThis as any).__AIDUX_TEST_PORT_MOCKS__ = true;

  class __MockMessagePort {
    onmessage: any = null;
    onmessageerror: any = null;
    postMessage(_msg: any) {}
    start() {}
    close() {
      this.onmessage = null;
      this.onmessageerror = null;
    }
    addEventListener() {}
    removeEventListener() {}
  }
  
  class __MockMessageChannel {
    port1 = new __MockMessagePort();
    port2 = new __MockMessagePort();
  }
  
  class __MockBroadcastChannel {
    name: string;
    onmessage: any = null;
    onmessageerror: any = null;
    constructor(name: string) { this.name = name; }
    postMessage(_msg: any) {}
    close() {
      this.onmessage = null;
      this.onmessageerror = null;
    }
    addEventListener() {}
    removeEventListener() {}
  }

  // Override immediately - no conditional assignment
  (globalThis as any).MessageChannel = __MockMessageChannel;
  (globalThis as any).BroadcastChannel = __MockBroadcastChannel;
  
  // Also override in global if available
  if (typeof global !== 'undefined') {
    (global as any).MessageChannel = __MockMessageChannel;
    (global as any).BroadcastChannel = __MockBroadcastChannel;
  }
  
  // Override in process if available (for Node.js environment)
  if (typeof process !== 'undefined' && (process as any).global) {
    ((process as any).global as any).MessageChannel = __MockMessageChannel;
    ((process as any).global as any).BroadcastChannel = __MockBroadcastChannel;
  }
}


