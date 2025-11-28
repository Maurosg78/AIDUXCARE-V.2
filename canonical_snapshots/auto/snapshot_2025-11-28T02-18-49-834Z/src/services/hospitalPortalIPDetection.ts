/**
 * Hospital Portal IP Detection Service
 * 
 * Attempts to detect client IP address for audit logging
 * Note: In browser context, IP detection is limited
 * Full IP detection requires server-side implementation (Cloud Functions)
 */

/**
 * Get client IP address
 * 
 * In browser context, this will return 'unknown' as browsers don't expose IP
 * For production, implement a Cloud Function endpoint that returns the client IP
 */
export async function getClientIPAddress(): Promise<string> {
  try {
    // Attempt 1: Try to get IP from a public IP service (if allowed)
    // Note: This requires CORS and may be blocked by privacy settings
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ip) {
          return data.ip;
        }
      }
    } catch (error) {
      // Fallback if IP service is unavailable
      console.warn('[IP Detection] Public IP service unavailable:', error);
    }

    // Attempt 2: Try Cloudflare headers (if behind Cloudflare)
    // This would be available server-side, not in browser
    
    // Attempt 3: Return unknown (will be set server-side in production)
    return 'unknown';
  } catch (error) {
    console.error('[IP Detection] Error detecting IP:', error);
    return 'unknown';
  }
}

/**
 * Get enhanced client info including IP
 */
export async function getEnhancedClientInfo(): Promise<{
  ipAddress: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
}> {
  const ipAddress = await getClientIPAddress();
  
  return {
    ipAddress,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

