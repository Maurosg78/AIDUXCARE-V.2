/**
 * Mobile Detection Utilities
 * 
 * Detects mobile devices, browsers, and capabilities for mobile testing
 */

export interface MobileInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  hasTouch: boolean;
  hasMicrophone: boolean;
  hasMediaRecorder: boolean;
}

/**
 * Detects if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detects if device is tablet
 */
export function isTabletDevice(): boolean {
  return /iPad|Android/i.test(navigator.userAgent) && 
         window.innerWidth >= 768 && 
         window.innerWidth < 1024;
}

/**
 * Detects if device is iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Detects if device is Android
 */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/**
 * Detects if browser is Safari
 */
export function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Detects if browser is Chrome
 */
export function isChrome(): boolean {
  return /Chrome/.test(navigator.userAgent) && !/Edg|OPR|Safari/.test(navigator.userAgent);
}

/**
 * Gets device type
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Checks if device has touch support
 */
export function hasTouchSupport(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Checks if device has microphone access
 */
export function hasMicrophoneAccess(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Checks if browser supports MediaRecorder
 */
export function hasMediaRecorderSupport(): boolean {
  return typeof MediaRecorder !== 'undefined';
}

/**
 * Gets comprehensive mobile information
 */
export function getMobileInfo(): MobileInfo {
  return {
    isMobile: isMobileDevice(),
    isTablet: isTabletDevice(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isSafari: isSafari(),
    isChrome: isChrome(),
    deviceType: getDeviceType(),
    browser: navigator.userAgent,
    os: navigator.platform,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    hasTouch: hasTouchSupport(),
    hasMicrophone: hasMicrophoneAccess(),
    hasMediaRecorder: hasMediaRecorderSupport()
  };
}

/**
 * Logs mobile info for debugging
 */
export function logMobileInfo(): void {
  const info = getMobileInfo();
  console.log('📱 Mobile Detection:', info);
}

