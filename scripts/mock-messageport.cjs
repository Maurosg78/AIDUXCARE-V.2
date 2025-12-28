/**
 * Mock BroadcastChannel at Node.js level for jsdom only.
 * This file is loaded via --require flag to intercept BroadcastChannel creation early.
 * 
 * NOTE: We only mock BroadcastChannel, NOT MessageChannel/MessagePort which Vitest needs
 * for --pool=threads. volta-shim creates MessagePort handles, but we'll close them in cleanup.
 */

if (!global.__AIDUX_TEST_PORT_MOCKS__) {
  global.__AIDUX_TEST_PORT_MOCKS__ = true;

  // Only mock BroadcastChannel (used by jsdom/browser APIs, not by Vitest workers)
  class MockBroadcastChannel {
    constructor(name) {
      this.name = name;
      this.onmessage = null;
      this.onmessageerror = null;
    }
    postMessage(_msg) {}
    close() {
      this.onmessage = null;
      this.onmessageerror = null;
    }
    addEventListener() {}
    removeEventListener() {}
  }

  // Override BroadcastChannel only (not MessageChannel - Vitest needs the real one)
  global.BroadcastChannel = MockBroadcastChannel;
  
  if (typeof globalThis !== 'undefined') {
    globalThis.BroadcastChannel = MockBroadcastChannel;
  }
}

