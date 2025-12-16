/**
 * URL Helper Functions
 * Ensures production URLs are used, never localhost in production
 */

/**
 * Get public base URL for SMS links and external references
 * 
 * Priority:
 * 1. Explicit VITE_PUBLIC_BASE_URL (production)
 * 2. Production environment detection (PROD flag)
 * 3. Development URL (VITE_DEV_PUBLIC_URL) - required for testing
 * 
 * @returns Public base URL (never localhost in production)
 * @throws Error if unable to determine URL
 */
export function getPublicBaseUrl(): string {
  // Priority 1: Explicit production URL
  if (import.meta.env.VITE_PUBLIC_BASE_URL) {
    const url = import.meta.env.VITE_PUBLIC_BASE_URL.trim();
    validateProductionUrl(url);
    return url;
  }
  
  // Priority 2: Production environment detection
  if (import.meta.env.PROD) {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
    
    // Production project
    if (projectId.includes('prod') || projectId.includes('production')) {
      return 'https://aiduxcare.web.app';
    }
    
    // UAT/Staging
    return 'https://aiduxcare-mvp-uat.web.app';
  }
  
  // Development: Require explicit URL for SMS testing
  if (import.meta.env.DEV) {
    const devUrl = import.meta.env.VITE_DEV_PUBLIC_URL;
    if (devUrl) {
      validateDevelopmentUrl(devUrl);
      return devUrl.trim();
    }
    // Fallback: Use production URL if available, otherwise throw error
    // This prevents localhost/IP addresses from being used in SMS links
    if (import.meta.env.VITE_PUBLIC_BASE_URL) {
      const prodUrl = import.meta.env.VITE_PUBLIC_BASE_URL.trim();
      validateProductionUrl(prodUrl);
      console.warn(
        '[URL Helper] VITE_DEV_PUBLIC_URL not set. Using production URL for SMS links. ' +
        'This may cause issues if the production URL is not accessible. ' +
        'Set VITE_DEV_PUBLIC_URL for development SMS testing.'
      );
      return prodUrl;
    }
    throw new Error(
      'VITE_DEV_PUBLIC_URL or VITE_PUBLIC_BASE_URL required for development SMS testing. ' +
      'Use ngrok or similar service to expose localhost (e.g., ngrok http 5174). ' +
      'Set VITE_DEV_PUBLIC_URL=https://your-ngrok-url.ngrok.io or VITE_PUBLIC_BASE_URL=https://your-production-url.com'
    );
  }
  
  throw new Error('Unable to determine public base URL. Set VITE_PUBLIC_BASE_URL or VITE_DEV_PUBLIC_URL');
}

/**
 * Validate production URL - must be HTTPS and not localhost
 */
function validateProductionUrl(url: string): void {
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    throw new Error(`Production URL cannot be localhost: ${url}`);
  }
  
  if (!url.startsWith('https://')) {
    throw new Error(`Production URL must use HTTPS: ${url}`);
  }
  
  // Basic URL format validation
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

/**
 * Validate development URL - can be HTTP or HTTPS
 * Warns if localhost (won't work on mobile)
 */
function validateDevelopmentUrl(url: string): void {
  // Development URLs can be http or https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(`Development URL must start with http:// or https://: ${url}`);
  }
  
  // Warn if using localhost (won't work on mobile)
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn(
      '⚠️ Localhost URL will not work on mobile devices. ' +
      'Use ngrok or similar service for SMS testing.'
    );
  }
  
  // Basic URL format validation
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

