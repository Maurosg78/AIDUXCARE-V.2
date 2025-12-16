/**
 * Mobile Viewport Fix Component
 * 
 * Applies mobile-specific viewport fixes for iOS Safari and Android Chrome
 */

import { useEffect } from 'react';
import { initMobileFixes } from '../../utils/mobileHelpers';
import { logMobileInfo } from '../../utils/mobileDetection';

export const MobileViewportFix: React.FC = () => {
  useEffect(() => {
    // Initialize mobile fixes
    initMobileFixes();
    
    // Log mobile info in development
    if (import.meta.env.DEV) {
      logMobileInfo();
    }
  }, []);

  return null;
};

