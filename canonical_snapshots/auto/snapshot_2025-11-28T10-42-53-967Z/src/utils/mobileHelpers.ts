/**
 * Mobile Helpers
 * 
 * Utility functions for mobile-specific UI adjustments
 */

/**
 * Prevents iOS input zoom on focus
 * Should be called on input focus
 */
export function preventIOSZoom(): void {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }
}

/**
 * Restores viewport after input blur
 */
export function restoreIOSZoom(): void {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
  }
}

/**
 * Gets safe area insets for iOS devices with notch
 */
export function getSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10)
  };
}

/**
 * Checks if viewport height needs fix (iOS Safari)
 */
export function needsViewportHeightFix(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && 
         /Safari/.test(navigator.userAgent) && 
         !/Chrome|CriOS|FxiOS|OPiOS/.test(navigator.userAgent);
}

/**
 * Gets actual viewport height (fixes iOS Safari issue)
 */
export function getActualViewportHeight(): number {
  if (needsViewportHeightFix()) {
    // iOS Safari viewport height fix
    return window.innerHeight || document.documentElement.clientHeight;
  }
  return window.innerHeight;
}

/**
 * Sets CSS custom property for viewport height
 */
export function setViewportHeight(): void {
  const vh = getActualViewportHeight() * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

/**
 * Initializes mobile-specific fixes
 */
export function initMobileFixes(): void {
  // Set viewport height
  setViewportHeight();
  
  // Update on resize/orientation change (optimized with throttle)
  let resizeTimeout: number | null = null;
  const handleResize = () => {
    if (resizeTimeout) {
      cancelAnimationFrame(resizeTimeout);
    }
    resizeTimeout = requestAnimationFrame(() => {
      setViewportHeight();
      resizeTimeout = null;
    });
  };
  
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', () => {
    // Use setTimeout for orientation change (more reliable)
    setTimeout(() => {
      setViewportHeight();
    }, 100);
  }, { passive: true });
  
  console.log('📱 Mobile fixes initialized');
}

