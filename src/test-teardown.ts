/**
 * Global Teardown for Vitest
 * 
 * This runs in the main process (not in test workers) and can close
 * handles created by volta-shim and other early loaders.
 */

export async function teardown() {
  try {
    // Close any remaining MessagePort handles (including volta-shim ones)
    const handles = (process as any)._getActiveHandles?.() ?? [];
    const messagePortHandles: any[] = [];
    
    for (const handle of handles) {
      // Check if it's a MessagePort-like handle
      const handleName = handle?.constructor?.name || '';
      
      // More aggressive detection: check for MessagePort characteristics
      if (handle && (
        handleName === 'MessagePort' ||
        handleName === 'MessageChannel' ||
        handleName.includes('MessagePort') ||
        handleName.includes('MessageChannel') ||
        // Check for handles with postMessage method (characteristic of MessagePort)
        (typeof handle.postMessage === 'function' && typeof handle.close === 'function') ||
        // Check for handles with port1/port2 properties (MessageChannel)
        (handle.port1 && handle.port2) ||
        // volta-shim handles might not have obvious names, check for close method and event-like properties
        (typeof handle.close === 'function' && (
          handleName.includes('Port') ||
          handleName.includes('Channel') ||
          handle.onmessage !== undefined ||
          handle.addEventListener !== undefined
        ))
      )) {
        messagePortHandles.push(handle);
      }
    }
    
    // Close all MessagePort handles aggressively
    for (const handle of messagePortHandles) {
      try {
        // Try multiple cleanup methods
        if (typeof handle.close === 'function') {
          handle.close();
        }
        if (typeof handle.destroy === 'function') {
          handle.destroy();
        }
        // Remove event listeners
        if (typeof handle.removeAllListeners === 'function') {
          handle.removeAllListeners();
        }
        if (typeof handle.removeEventListener === 'function') {
          handle.removeEventListener('message', () => {});
          handle.removeEventListener('messageerror', () => {});
        }
        // Clear message handlers
        if (handle.onmessage) {
          handle.onmessage = null;
        }
        if (handle.onmessageerror) {
          handle.onmessageerror = null;
        }
        // Close ports if it's a MessageChannel
        if (handle.port1 && typeof handle.port1.close === 'function') {
          handle.port1.close();
        }
        if (handle.port2 && typeof handle.port2.close === 'function') {
          handle.port2.close();
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    
    // Small delay to allow cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Log what we found for debugging
    if (messagePortHandles.length > 0) {
      console.error(`[test-teardown] Closed ${messagePortHandles.length} MessagePort handles`);
    }
    
    // Force process to exit if there are still hanging handles
    // This is a last resort to prevent the process from hanging
    const remainingHandles = (process as any)._getActiveHandles?.() ?? [];
    const remainingPorts = remainingHandles.filter((h: any) => {
      const name = h?.constructor?.name || '';
      return name.includes('Port') || name.includes('Channel') || 
             (typeof h.close === 'function' && h.postMessage);
    });
    
    if (remainingPorts.length > 0) {
      console.error(`[test-teardown] Warning: ${remainingPorts.length} MessagePort handles still active after cleanup`);
      // Try one more aggressive cleanup
      for (const handle of remainingPorts) {
        try {
          if (handle.close) handle.close();
          if (handle.destroy) handle.destroy();
          if (handle.removeAllListeners) handle.removeAllListeners();
        } catch (e) {
          // Ignore
        }
      }
      
      // If handles persist, force exit after a short delay
      // This prevents the process from hanging indefinitely
      setTimeout(() => {
        const stillActive = (process as any)._getActiveHandles?.() ?? [];
        const stillActivePorts = stillActive.filter((h: any) => {
          const name = h?.constructor?.name || '';
          return name.includes('Port') || name.includes('Channel');
        });
        
        if (stillActivePorts.length > 0) {
          console.error(`[test-teardown] Forcing exit due to ${stillActivePorts.length} persistent MessagePort handles`);
          process.exit(0);
        }
      }, 100);
    }
  } catch (e) {
    // Ignore errors during cleanup
    console.error('[test-teardown] Error during cleanup:', e);
  }
}

