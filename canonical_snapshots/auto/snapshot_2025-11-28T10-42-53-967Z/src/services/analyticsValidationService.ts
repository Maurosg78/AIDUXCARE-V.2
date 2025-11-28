/**
 * Analytics Validation Service
 * 
 * Validates analytics queries to prevent PHI access and ensure PHIPA/PIPEDA compliance.
 * Blocks queries that attempt to access protected health information (PHI).
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 */

/**
 * Interface for violation attempt logging
 */
export interface ViolationAttempt {
  query: any;
  prohibitedField: string;
  timestamp: string;
  user?: string;
  collection?: string;
}

/**
 * Validation function to detect prohibited analytics queries
 * 
 * REQUIREMENTS:
 * - Run before every analytics query
 * - Block queries that access PHI
 * - Log attempted violations
 * 
 * @param query - Analytics query object to validate
 * @param collection - Collection name being queried (optional)
 * @throws Error if query contains prohibited PHI fields
 */
export function validateAnalyticsQuery(query: any, collection?: string): void {
  const prohibitedFields = [
    // PHI Identifiers
    'patientId',
    'patientName',
    
    // PHI Content
    'transcript',
    'soapNote',
    'soapNote.subjective',
    'soapNote.objective',
    'soapNote.assessment',
    'soapNote.plan',
    'soapNote.additionalNotes',
    'soapNote.followUp',
    'soapNote.precautions',
    'soapNote.referrals',
    
    // PHI Physical Test Results
    'physicalTests.result',
    'physicalTests.notes',
    'physicalTests.values',
    'physicalTests.values.angle_left',
    'physicalTests.values.angle_right',
    'physicalTests.values.strength',
    'physicalTests.values.pain_score',
    'physicalTests.values.yes_no',
    'physicalTests.values.text',
    'physicalTests._prefillDefaults', // Internal field, no analytics
    
    // PHI Treatment Plans
    'treatment_plans.patientId',
    'treatment_plans.patientName',
    'treatment_plans.planText',
    'treatment_plans.goals',
    'treatment_plans.interventions',
    'treatment_plans.nextAppointment',
    
    // PHI Attachments
    'attachments.name',
    'attachments.file_content',
    'attachments.downloadURL',
    
    // Prohibited patterns
    'patient_id',
    'patient_name',
    'soap_content',
    'clinical_findings',
  ];
  
  // Check if query includes prohibited fields
  const queryString = JSON.stringify(query).toLowerCase();
  for (const field of prohibitedFields) {
    const fieldLower = field.toLowerCase();
    if (queryString.includes(fieldLower)) {
      // Log violation attempt
      logViolationAttempt({
        query,
        prohibitedField: field,
        timestamp: new Date().toISOString(),
        collection,
      });
      
      throw new Error(
        `PROHIBITED: Cannot query field '${field}' for analytics. ` +
        `This field contains PHI and violates PHIPA/PIPEDA compliance. ` +
        `Use analytics_events collection with hashed identifiers instead.`
      );
    }
  }
  
  // Additional validation: Check if querying sessions collection directly
  if (queryString.includes('collection') && queryString.includes('sessions') && 
      !queryString.includes('analytics_events')) {
    // Only allow queries to sessions if they're filtered to non-PHI fields
    // This is a safety check, but sessions should generally not be queried for analytics
    console.warn(
      'WARNING: Querying sessions collection for analytics. ' +
      'Ensure no PHI fields are included in results.'
    );
  }
}

/**
 * Validate k-anonymity requirement for aggregated queries
 * 
 * REQUIREMENTS:
 * - Minimum 5 users/events per aggregation group
 * - Prevents re-identification from small sample sizes
 * 
 * @param count - Number of users/events in aggregation
 * @param minimum - Minimum required for k-anonymity (default: 5)
 * @throws Error if count is below minimum
 */
export function validateKAnonymity(count: number, minimum: number = 5): void {
  if (count < minimum) {
    throw new Error(
      `Insufficient data for aggregation (k-anonymity requirement). ` +
      `Minimum ${minimum} users/events required, found ${count}. ` +
      `This prevents potential re-identification of individuals.`
    );
  }
}

/**
 * Log violation attempt for audit trail
 * 
 * In production, this should write to a secure audit log collection.
 * For now, logs to console and could be extended to Firestore.
 * 
 * @param violation - Violation attempt data
 */
export function logViolationAttempt(violation: ViolationAttempt): void {
  // Log to console (in production, this should go to secure audit log)
  console.error('[COMPLIANCE VIOLATION]', {
    timestamp: violation.timestamp,
    prohibitedField: violation.prohibitedField,
    collection: violation.collection || 'unknown',
    user: violation.user || 'unknown',
    query: JSON.stringify(violation.query).substring(0, 200), // Truncate for logging
  });
  
  // TODO: In production, write to Firestore audit log collection
  // await addDoc(collection(db, 'compliance_audit_log'), {
  //   ...violation,
  //   severity: 'high',
  //   action: 'blocked',
  // });
}

/**
 * Get current user ID for violation logging
 * 
 * This should be replaced with actual auth context in production
 * 
 * @returns Current user ID or 'system' if not available
 */
function getCurrentUser(): string {
  // TODO: Replace with actual auth context
  // For now, return 'system' as placeholder
  return 'system';
}

/**
 * Validate that analytics query only uses allowed collections
 * 
 * REQUIREMENTS:
 * - Analytics should only query analytics_events collection
 * - Sessions collection should not be queried for analytics
 * 
 * @param collectionName - Name of collection being queried
 * @throws Error if querying prohibited collection
 */
export function validateAnalyticsCollection(collectionName: string): void {
  const allowedCollections = [
    'analytics_events',
    'system_analytics', // Legacy collection, consider migrating
  ];
  
  const prohibitedCollections = [
    'sessions',
    'treatment_plans',
    'clinical_attachments',
  ];
  
  if (prohibitedCollections.includes(collectionName)) {
    logViolationAttempt({
      query: { collection: collectionName },
      prohibitedField: `collection:${collectionName}`,
      timestamp: new Date().toISOString(),
      collection: collectionName,
    });
    
    throw new Error(
      `PROHIBITED: Cannot query collection '${collectionName}' for analytics. ` +
      `This collection contains PHI. Use 'analytics_events' collection instead.`
    );
  }
  
  if (!allowedCollections.includes(collectionName)) {
    console.warn(
      `WARNING: Querying collection '${collectionName}' for analytics. ` +
      `Ensure this collection does not contain PHI.`
    );
  }
}

