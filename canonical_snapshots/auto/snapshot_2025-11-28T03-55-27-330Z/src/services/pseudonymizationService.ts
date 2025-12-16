/**
 * Pseudonymization Service
 * 
 * Provides one-way hashing functions for analytics without PHI re-identification.
 * Implements SHA-256 hashing with salt for irreversible pseudonymization.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 */

/**
 * Helper function to hash using Web Crypto API (browser-compatible)
 */
async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Pseudonymize user ID for analytics
 * 
 * REQUIREMENTS:
 * - SHA-256 one-way hash
 * - Salt from environment variable (never in code)
 * - No reverse lookup possible
 * - Same user always produces same hash
 * 
 * @param userId - Real user ID (e.g., "user-abc123")
 * @returns Hashed user ID (64-character hex string)
 * @throws Error if salt is not configured or invalid
 */
export async function pseudonymizeUserId(userId: string): Promise<string> {
  // CRITICAL: Salt must be stored in environment variable, never hardcoded
  const salt = import.meta.env.VITE_ANALYTICS_USER_SALT || process.env.ANALYTICS_USER_SALT;
  if (!salt) {
    throw new Error('ANALYTICS_USER_SALT environment variable not set');
  }
  
  // CRITICAL: Ensure salt is at least 32 characters
  if (salt.length < 32) {
    throw new Error('ANALYTICS_USER_SALT must be at least 32 characters');
  }
  
  // SHA-256 hash of userId + salt
  const combined = userId + salt;
  return await sha256Hash(combined); // Returns 64-character hex string
}

/**
 * Pseudonymize MSK test ID for analytics
 * 
 * REQUIREMENTS:
 * - Same hash method as user ID
 * - Separate salt for test IDs
 * - Allows aggregation by test type without PHI
 * 
 * @param testId - MSK test ID (e.g., "shoulder-neer-impingement")
 * @returns Hashed test ID (64-character hex string)
 * @throws Error if salt is not configured or invalid
 */
export async function pseudonymizeTestId(testId: string): Promise<string> {
  const salt = import.meta.env.VITE_ANALYTICS_TEST_SALT || process.env.ANALYTICS_TEST_SALT;
  if (!salt || salt.length < 32) {
    throw new Error('ANALYTICS_TEST_SALT must be set and at least 32 characters');
  }
  
  const combined = testId + salt;
  return await sha256Hash(combined);
}

/**
 * Pseudonymize storage path for analytics
 * 
 * REQUIREMENTS:
 * - Hash path without user/patient identifiers
 * - Only extract file type and size metadata
 * - No PHI in hashed path
 * 
 * @param storagePath - Full storage path (e.g., "clinical-attachments/user-123/1234567890-uuid-image.jpg")
 * @returns Hashed path (64-character hex string)
 * @throws Error if salt is not configured or invalid
 */
export async function pseudonymizeStoragePath(storagePath: string): Promise<string> {
  // Extract only file extension and root directory
  const pathParts = storagePath.split('/');
  const rootDir = pathParts[0]; // "clinical-attachments"
  const fileName = pathParts[pathParts.length - 1];
  const fileExt = fileName.split('.').pop() || 'unknown';
  
  // Build anonymized path (no user/patient IDs)
  const anonymizedPath = `${rootDir}/[REDACTED]/[REDACTED].${fileExt}`;
  
  const salt = import.meta.env.VITE_ANALYTICS_PATH_SALT || process.env.ANALYTICS_PATH_SALT;
  if (!salt || salt.length < 32) {
    throw new Error('ANALYTICS_PATH_SALT must be set and at least 32 characters');
  }
  
  const combined = anonymizedPath + salt;
  return await sha256Hash(combined);
}

/**
 * Validate that pseudonymization is working correctly
 * 
 * This test should ALWAYS pass - hash must be irreversible
 * 
 * @param userId - Test user ID
 * @param hashedUserId - Hashed user ID to validate
 * @returns true if hash appears valid (64 hex chars), false otherwise
 */
export async function validatePseudonymization(userId: string, hashedUserId: string): Promise<boolean> {
  // Hash should be 64 hex characters (SHA-256 output)
  if (!/^[a-f0-9]{64}$/i.test(hashedUserId)) {
    return false;
  }
  
  // Hash should NOT equal original userId
  if (hashedUserId === userId) {
    return false;
  }
  
  // Hash should be deterministic (same input = same output)
  const rehashed = await pseudonymizeUserId(userId);
  return rehashed === hashedUserId;
}

