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
    
    // UAT/Staging - Match project ID to correct site
    if (projectId.includes('aiduxcare-v2-uat-dev')) {
      return 'https://aiduxcare-v2-uat-dev.web.app';
    }
    // ✅ WO-P0.2: Removed fallback to legacy mvp-uat (no longer supported)
    // If project ID includes 'uat' but not 'aiduxcare-v2-uat-dev', throw error
    if (projectId.includes('uat')) {
      throw new Error(
        `❌ SMS BLOCKED: Legacy UAT project detected (${projectId}). ` +
        `Set VITE_PUBLIC_BASE_URL=https://aiduxcare-v2-uat-dev.web.app explicitly.`
      );
    }
    
    // Default UAT fallback (should not happen if project ID is set correctly)
    return 'https://aiduxcare-v2-uat-dev.web.app';
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
 * Validate production URL - must be HTTPS and not localhost/private IP
 */
function validateProductionUrl(url: string): void {
  // Block localhost and private IPs
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('192.168.') || url.includes('10.') || url.includes('172.16.')) {
    throw new Error(
      `❌ SMS BLOCKED: Production URL cannot be localhost or private IP: ${url}\n` +
      'Production URLs must be publicly accessible (e.g., https://aiduxcare-mvp-uat.web.app).'
    );
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
 * Blocks localhost and private IPs (fail-fast for SMS)
 */
function validateDevelopmentUrl(url: string): void {
  // Development URLs can be http or https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(`Development URL must start with http:// or https://: ${url}`);
  }
  
  // CRITICAL: Block localhost/IPs privadas para SMS (no funcionarán en móvil)
  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('192.168.') || url.includes('10.') || url.includes('172.16.')) {
    throw new Error(
      `❌ SMS BLOCKED: Development URL cannot be localhost or private IP: ${url}\n` +
      'SMS links must use a publicly accessible URL (e.g., ngrok, Firebase Hosting, or production URL).\n' +
      'Set VITE_DEV_PUBLIC_URL to a public URL (e.g., https://your-ngrok-url.ngrok.io) or use VITE_PUBLIC_BASE_URL for production.'
    );
  }
  
  // Basic URL format validation
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }
}

