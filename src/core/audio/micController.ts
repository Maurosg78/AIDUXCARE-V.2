// Centralized microphone controller to ensure ONLY one active audio stream at a time.
// This is a singleton at module level – all hooks/components share the same instance.

let activeStream: MediaStream | null = null;

export const micController = {
  /**
   * Register a newly acquired MediaStream as the global active stream.
   * If there was a previous active stream, all of its tracks are stopped first.
   */
  registerStream(stream: MediaStream) {
    if (activeStream && activeStream !== stream) {
      try {
        activeStream.getTracks().forEach((t) => {
          try {
            if (t.readyState === 'live') {
              t.stop();
            }
          } catch {
            // Swallow per-track errors – we're in best-effort cleanup
          }
        });
      } catch {
        // Ignore errors from iterating previous stream
      }
    }
    activeStream = stream;
  },

  /**
   * Hard kill-switch for the currently active stream, if any.
   */
  stopActiveStream() {
    if (!activeStream) return;

    try {
      activeStream.getTracks().forEach((t) => {
        try {
          if (t.readyState === 'live') {
            t.stop();
          }
        } catch {
          // Ignore per-track errors
        }
      });
    } catch {
      // Ignore errors from iterating active stream
    }

    activeStream = null;
  },

  /**
   * Read-only access to the currently active stream (for debug/inspection).
   */
  getActiveStream(): MediaStream | null {
    return activeStream;
  },
};

