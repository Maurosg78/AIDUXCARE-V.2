/**
 * Follow-up Detection Service
 * 
 * Intelligent detection algorithm to differentiate follow-up visits from initial evaluations.
 * Uses multi-factor analysis: patient history, keywords, and metadata.
 * 
 * @compliance PHIPA compliant (no data handling changes)
 * @audit ISO 27001 A.8.2.3 (Handling of assets)
 */

import { EpisodeService } from './episodeService';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

// ✅ ISO 27001 AUDIT: Lazy import to prevent build issues
let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;

const getAuditLogger = async () => {
  if (!FirestoreAuditLogger) {
    const module = await import('../core/audit/FirestoreAuditLogger');
    FirestoreAuditLogger = module.FirestoreAuditLogger;
  }
  return FirestoreAuditLogger;
};

export interface FollowUpDetectionResult {
  isFollowUp: boolean;
  confidence: number; // 0-100
  rationale: string[];
  lastVisitDate?: Date;
  daysSinceLastVisit?: number;
  keywordsFound?: string[];
  manualOverride?: boolean;
  recommendedWorkflow: 'initial' | 'follow-up' | 'suggest-follow-up';
}

export interface FollowUpDetectionInput {
  patientId: string;
  chiefComplaint?: string;
  consultationType?: string;
  providerNotes?: string;
  appointmentData?: {
    scheduledType?: string;
    reason?: string;
  };
  manualOverride?: 'initial' | 'follow-up';
}

// Follow-up keywords (case-insensitive)
const FOLLOW_UP_KEYWORDS = [
  // Explicit follow-up terms
  'follow-up', 'follow up', 'f/u', 'f/u.', 'fu',
  'return visit', 'returning', 'revisit',
  'continuation', 'continuing', 'ongoing',
  
  // Progress indicators
  'progress', 'improvement', 'worse', 'same', 'unchanged',
  'better', 'worsening', 'improving',
  
  // Temporal references
  'since last visit', 'since last time', 'since last appointment',
  'since last session', 'since previous',
  
  // Maintenance/continuation
  'maintenance', 'maintaining', 'continue treatment',
  'ongoing care', 'continued care',
  
  // Review/check-up
  'review', 'check-up', 'checkup', 'reassessment',
  're-evaluation', 'reevaluation',
];

// Primary indicators weight (total: 70 points)
const PRIMARY_WEIGHTS = {
  RECENT_EPISODE: 40, // Episode within 30 days
  KEYWORDS_IN_COMPLAINT: 30, // Follow-up keywords found
};

// Secondary indicators weight (total: 30 points)
const SECONDARY_WEIGHTS = {
  CONSULTATION_TYPE: 15, // Metadata indicates follow-up
  PROVIDER_NOTES: 10, // Provider notes indicate follow-up
  APPOINTMENT_DATA: 5, // Appointment scheduling data
};

// Confidence thresholds (CTO approved)
const CONFIDENCE_THRESHOLDS = {
  AUTO_FOLLOW_UP: 80, // 80%+ → Automatic follow-up mode
  SUGGEST_FOLLOW_UP: 60, // 60-79% → Suggest follow-up with user confirmation
  DEFAULT_INITIAL: 0, // <60% → Default to initial evaluation
};

/**
 * Checks if patient has recent episodes (<30 days)
 * 
 * @param patientId Patient ID
 * @returns Recent episode info or null
 */
async function checkRecentEpisodes(patientId: string): Promise<{
  hasRecentEpisode: boolean;
  lastVisitDate?: Date;
  daysSinceLastVisit?: number;
} | null> {
  try {
    // Check episodes collection
    const episodesRef = collection(db, 'episodes');
    const q = query(
      episodesRef,
      where('patientId', '==', patientId),
      orderBy('dates.admissionDate', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { hasRecentEpisode: false };
    }
    
    const latestEpisode = snapshot.docs[0].data();
    const admissionDate = latestEpisode.dates?.admissionDate;
    
    if (!admissionDate) {
      return { hasRecentEpisode: false };
    }
    
    const admissionTimestamp = admissionDate instanceof Timestamp 
      ? admissionDate.toDate() 
      : new Date(admissionDate);
    
    const daysSince = Math.floor(
      (Date.now() - admissionTimestamp.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const hasRecentEpisode = daysSince <= 30;
    
    return {
      hasRecentEpisode,
      lastVisitDate: admissionTimestamp,
      daysSinceLastVisit: daysSince,
    };
  } catch (error: any) {
    // Handle missing index error gracefully - return null to continue without episode check
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.warn('[FollowUpDetection] Firestore index missing for episodes query. Continuing without episode check. Create index:', error?.message);
      return { hasRecentEpisode: false };
    }
    console.error('[FollowUpDetection] Error checking recent episodes:', error);
    return { hasRecentEpisode: false };
  }
}

/**
 * Detects follow-up keywords in text
 * 
 * @param text Text to analyze
 * @returns Array of found keywords
 */
function detectKeywords(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const lowerText = text.toLowerCase();
  const foundKeywords: string[] = [];
  
  for (const keyword of FOLLOW_UP_KEYWORDS) {
    const keywordLower = keyword.toLowerCase();
    // Check for whole word matches (with word boundaries)
    const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText)) {
      foundKeywords.push(keyword);
    }
  }
  
  return foundKeywords;
}

/**
 * Detects follow-up visit using multi-factor algorithm
 * 
 * @param input Detection input parameters
 * @returns Detection result with confidence and rationale
 */
export async function detectFollowUp(
  input: FollowUpDetectionInput
): Promise<FollowUpDetectionResult> {
  // Manual override takes precedence
  if (input.manualOverride) {
    const result: FollowUpDetectionResult = {
      isFollowUp: input.manualOverride === 'follow-up',
      confidence: 100,
      rationale: [`Manual override: ${input.manualOverride}`],
      manualOverride: true,
      recommendedWorkflow: input.manualOverride === 'follow-up' ? 'follow-up' : 'initial',
    };
    
    // Log manual override
    const logger = await getAuditLogger();
    await logger.logEvent({
      type: 'workflow_manual_override',
      userId: 'system',
      userRole: 'system',
      patientId: input.patientId,
      metadata: {
        overrideType: input.manualOverride,
        timestamp: new Date().toISOString(),
      },
    });
    
    return result;
  }
  
  let confidence = 0;
  const rationale: string[] = [];
  
  // PRIMARY INDICATORS (70 points total)
  
  // 1. Recent episode check (40 points)
  const recentEpisodeInfo = await checkRecentEpisodes(input.patientId);
  if (recentEpisodeInfo?.hasRecentEpisode) {
    confidence += PRIMARY_WEIGHTS.RECENT_EPISODE;
    rationale.push(
      `Recent episode found: ${recentEpisodeInfo.daysSinceLastVisit} days ago`
    );
    if (recentEpisodeInfo.lastVisitDate) {
      rationale.push(`Last visit: ${recentEpisodeInfo.lastVisitDate.toISOString()}`);
    }
  } else if (recentEpisodeInfo) {
    rationale.push(
      `No recent episodes (last visit: ${recentEpisodeInfo.daysSinceLastVisit || 'unknown'} days ago)`
    );
  }
  
  // 2. Keywords in chief complaint (30 points)
  if (input.chiefComplaint) {
    const keywords = detectKeywords(input.chiefComplaint);
    if (keywords.length > 0) {
      const keywordScore = Math.min(
        PRIMARY_WEIGHTS.KEYWORDS_IN_COMPLAINT,
        keywords.length * 10 // Up to 30 points for multiple keywords
      );
      confidence += keywordScore;
      rationale.push(`Follow-up keywords found: ${keywords.join(', ')}`);
    } else {
      rationale.push('No follow-up keywords in chief complaint');
    }
  }
  
  // SECONDARY INDICATORS (30 points total)
  
  // 3. Consultation type metadata (15 points)
  if (input.consultationType) {
    const consultationLower = input.consultationType.toLowerCase();
    if (consultationLower.includes('follow') || 
        consultationLower.includes('return') ||
        consultationLower.includes('revisit')) {
      confidence += SECONDARY_WEIGHTS.CONSULTATION_TYPE;
      rationale.push(`Consultation type indicates follow-up: ${input.consultationType}`);
    }
  }
  
  // 4. Provider notes (10 points)
  if (input.providerNotes) {
    const notesKeywords = detectKeywords(input.providerNotes);
    if (notesKeywords.length > 0) {
      confidence += SECONDARY_WEIGHTS.PROVIDER_NOTES;
      rationale.push(`Follow-up indicators in provider notes: ${notesKeywords.join(', ')}`);
    }
  }
  
  // 5. Appointment data (5 points)
  if (input.appointmentData) {
    if (input.appointmentData.scheduledType?.toLowerCase().includes('follow') ||
        input.appointmentData.reason?.toLowerCase().includes('follow')) {
      confidence += SECONDARY_WEIGHTS.APPOINTMENT_DATA;
      rationale.push('Appointment data indicates follow-up');
    }
  }
  
  // Determine recommended workflow based on confidence
  let recommendedWorkflow: 'initial' | 'follow-up' | 'suggest-follow-up';
  if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_FOLLOW_UP) {
    recommendedWorkflow = 'follow-up';
  } else if (confidence >= CONFIDENCE_THRESHOLDS.SUGGEST_FOLLOW_UP) {
    recommendedWorkflow = 'suggest-follow-up';
  } else {
    recommendedWorkflow = 'initial';
  }
  
  const result: FollowUpDetectionResult = {
    isFollowUp: confidence >= CONFIDENCE_THRESHOLDS.AUTO_FOLLOW_UP,
    confidence: Math.min(100, Math.max(0, confidence)), // Clamp 0-100
    rationale,
    lastVisitDate: recentEpisodeInfo?.lastVisitDate,
    daysSinceLastVisit: recentEpisodeInfo?.daysSinceLastVisit,
    keywordsFound: input.chiefComplaint ? detectKeywords(input.chiefComplaint) : undefined,
    recommendedWorkflow,
  };
  
  // Log detection event for audit
  const logger = await getAuditLogger();
  await logger.logEvent({
    type: 'workflow_detection',
    userId: 'system',
    userRole: 'system',
    patientId: input.patientId,
    metadata: {
      confidence,
      recommendedWorkflow,
      rationale,
      timestamp: new Date().toISOString(),
    },
  });
  
  return result;
}

/**
 * Validates detection result and provides user-friendly explanation
 * 
 * @param result Detection result
 * @returns User-friendly explanation
 */
export function explainDetectionResult(result: FollowUpDetectionResult): string {
  if (result.manualOverride) {
    return `Manual selection: ${result.isFollowUp ? 'Follow-up' : 'Initial Evaluation'}`;
  }
  
  if (result.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FOLLOW_UP) {
    return `Auto-detected as Follow-up (${result.confidence}% confidence). ${result.rationale.join('; ')}`;
  } else if (result.confidence >= CONFIDENCE_THRESHOLDS.SUGGEST_FOLLOW_UP) {
    return `Suggested Follow-up (${result.confidence}% confidence). ${result.rationale.join('; ')}`;
  } else {
    return `Initial Evaluation (${result.confidence}% confidence). ${result.rationale.join('; ')}`;
  }
}


