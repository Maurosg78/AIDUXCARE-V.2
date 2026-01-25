/**
 * Follow-up Detection Service
 * 
 * Intelligent detection algorithm to differentiate follow-up visits from initial evaluations.
 * Uses multi-factor analysis: patient history, keywords, and metadata.
 * 
 * @compliance PHIPA-aware (design goal, no data handling changes)
 * @audit Security control reference (internal) - Handling of assets
 */

import { EpisodeService } from './episodeService';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

// ✅ Security audit: Lazy import to prevent build issues
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
 * Checks if patient has recent visits by searching multiple collections
 * 
 * @param patientId Patient ID
 * @returns Recent visit info with last visit date and days since
 */
async function checkRecentEpisodes(patientId: string): Promise<{
  hasRecentEpisode: boolean;
  lastVisitDate?: Date;
  daysSinceLastVisit?: number;
} | null> {
  let lastVisitDate: Date | null = null;
  const visitDates: Date[] = [];
  
  try {
    // 1. Check sessions collection (most reliable for visit tracking)
    try {
      const sessionsRef = collection(db, 'sessions');
      const sessionsQuery = query(
        sessionsRef,
        where('patientId', '==', patientId),
        orderBy('timestamp', 'desc'),
        limit(5) // Get last 5 sessions to find most recent
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
          const visitDate = data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate() 
            : data.timestamp?.toDate?.() || new Date(data.timestamp);
          if (visitDate && !isNaN(visitDate.getTime())) {
            visitDates.push(visitDate);
          }
        }
        // Also check createdAt if timestamp not available
        if (data.createdAt) {
          const visitDate = data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : data.createdAt?.toDate?.() || new Date(data.createdAt);
          if (visitDate && !isNaN(visitDate.getTime())) {
            visitDates.push(visitDate);
          }
        }
      });
    } catch (error: any) {
      console.warn('[FollowUpDetection] Error checking sessions:', error?.message);
    }
    
    // 2. Check consultations/notes collection (SOAP notes)
    try {
      // WO-FS-QUERY-01: Add ownership filter to align with Firestore rules
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('[FollowUpDetection] User not authenticated, skipping consultations check');
        return;
      }
      
      const consultationsRef = collection(db, 'consultations');
      const consultationsQuery = query(
        consultationsRef,
        where('patientId', '==', patientId),
        where('authorUid', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const consultationsSnapshot = await getDocs(consultationsQuery);
      
      consultationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          const visitDate = typeof data.createdAt === 'string' 
            ? new Date(data.createdAt)
            : data.createdAt instanceof Timestamp 
              ? data.createdAt.toDate() 
              : data.createdAt?.toDate?.() || new Date(data.createdAt);
          if (visitDate && !isNaN(visitDate.getTime())) {
            visitDates.push(visitDate);
          }
        }
      });
    } catch (error: any) {
      console.warn('[FollowUpDetection] Error checking consultations:', error?.message);
    }
    
    // 3. Check episodes collection (if exists)
    try {
      // WO-FS-QUERY-01: Add ownership filter to align with Firestore rules
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn('[FollowUpDetection] User not authenticated, skipping episodes check');
        return;
      }
      
      const episodesRef = collection(db, 'episodes');
      const episodesQuery = query(
        episodesRef,
        where('patientId', '==', patientId),
        where('ownerUid', '==', currentUser.uid),
        orderBy('dates.admissionDate', 'desc'),
        limit(1)
      );
      const episodesSnapshot = await getDocs(episodesQuery);
      
      if (!episodesSnapshot.empty) {
        const latestEpisode = episodesSnapshot.docs[0].data();
        const admissionDate = latestEpisode.dates?.admissionDate;
        if (admissionDate) {
          const visitDate = admissionDate instanceof Timestamp 
            ? admissionDate.toDate() 
            : new Date(admissionDate);
          if (visitDate && !isNaN(visitDate.getTime())) {
            visitDates.push(visitDate);
          }
        }
      }
    } catch (error: any) {
      // Handle missing index error gracefully
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('[FollowUpDetection] Firestore index missing for episodes query. Skipping episodes check.');
      } else {
        console.warn('[FollowUpDetection] Error checking episodes:', error?.message);
      }
    }
    
    // Find the most recent visit date
    if (visitDates.length > 0) {
      visitDates.sort((a, b) => b.getTime() - a.getTime());
      lastVisitDate = visitDates[0];
    }
    
    // Calculate days since last visit
    if (lastVisitDate) {
      const daysSince = Math.floor(
        (Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const hasRecentEpisode = daysSince <= 30;
      
      return {
        hasRecentEpisode,
        lastVisitDate,
        daysSinceLastVisit: daysSince,
      };
    }
    
    // WO-FS-DATA-03: No visits found - initial state (valid, not an error)
    if (import.meta.env.DEV) {
      console.info('[FS] No historical data found — initial state (follow-up detection)');
    }
    return { 
      hasRecentEpisode: false,
      daysSinceLastVisit: undefined
    };
    
  } catch (error: any) {
    // WO-FS-DATA-03: Handle permission-denied as "no data yet" for historical queries
    const isPermissionDenied = error?.code === 'permission-denied' || 
                               error?.message?.includes('permission-denied') ||
                               error?.message?.includes('Missing or insufficient permissions');
    
    if (isPermissionDenied) {
      // Permission denied in empty state = no data yet, return initial state
      if (import.meta.env.DEV) {
        console.info('[FS] No historical data found — initial state (follow-up detection, permission-denied)');
      }
      return { 
        hasRecentEpisode: false,
        daysSinceLastVisit: undefined
      };
    }
    
    console.error('[FollowUpDetection] Error checking recent visits:', error);
    return { 
      hasRecentEpisode: false,
      daysSinceLastVisit: undefined
    };
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
 * @param userId Optional user ID for audit logging (must match authenticated user)
 * @returns Detection result with confidence and rationale
 */
export async function detectFollowUp(
  input: FollowUpDetectionInput,
  userId?: string
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
  
  // WO-FS-DATA-03: If no historical data found, return initial state (not an error)
  if (!recentEpisodeInfo || (!recentEpisodeInfo.hasRecentEpisode && recentEpisodeInfo.daysSinceLastVisit === undefined)) {
    return {
      isFollowUp: false,
      confidence: 0,
      rationale: ['No prior clinical data found'],
      recommendedWorkflow: 'initial',
    };
  }
  
  if (recentEpisodeInfo) {
    if (recentEpisodeInfo.hasRecentEpisode && recentEpisodeInfo.daysSinceLastVisit !== undefined) {
      confidence += PRIMARY_WEIGHTS.RECENT_EPISODE;
      rationale.push(
        `Recent visit found: ${recentEpisodeInfo.daysSinceLastVisit} days ago`
      );
      if (recentEpisodeInfo.lastVisitDate) {
        const formattedDate = recentEpisodeInfo.lastVisitDate.toLocaleDateString('en-CA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        rationale.push(`Last visit date: ${formattedDate}`);
      }
    } else if (recentEpisodeInfo.daysSinceLastVisit !== undefined) {
      // Visit found but >30 days ago - still relevant for follow-up detection
      const daysSince = recentEpisodeInfo.daysSinceLastVisit;
      if (daysSince <= 90) {
        // Give partial credit for visits within 90 days
        confidence += Math.floor(PRIMARY_WEIGHTS.RECENT_EPISODE * (1 - (daysSince - 30) / 60));
        rationale.push(
          `Previous visit found: ${daysSince} days ago (outside 30-day window but relevant)`
        );
        if (recentEpisodeInfo.lastVisitDate) {
          const formattedDate = recentEpisodeInfo.lastVisitDate.toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          rationale.push(`Last visit date: ${formattedDate}`);
        }
      } else {
        rationale.push(
          `Previous visit found: ${daysSince} days ago (more than 90 days - likely initial assessment needed)`
        );
        if (recentEpisodeInfo.lastVisitDate) {
          const formattedDate = recentEpisodeInfo.lastVisitDate.toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          rationale.push(`Last visit date: ${formattedDate}`);
        }
      }
    } else {
      rationale.push('No previous visits found in patient record');
    }
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
  
  // 3. Consultation type metadata (15 points) - Boost if explicitly "followup" in URL
  if (input.consultationType) {
    const consultationLower = input.consultationType.toLowerCase();
    if (consultationLower === 'followup' || consultationLower === 'follow-up') {
      // Explicit follow-up in URL gets higher weight
      confidence += SECONDARY_WEIGHTS.CONSULTATION_TYPE + 10; // Extra 10 points for explicit type
      rationale.push(`Explicit follow-up consultation type: ${input.consultationType}`);
    } else if (consultationLower.includes('follow') || 
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
  
  // ✅ T2: Structured logging (without PHI) - log once per detection
  console.log('[Workflow Detection]', {
    confidence: result.confidence,
    recommendedWorkflow: result.recommendedWorkflow,
    rationale: result.rationale, // Generic reasons only, no transcript
    isFollowUp: result.isFollowUp,
    isGrayZone: confidence >= CONFIDENCE_THRESHOLDS.SUGGEST_FOLLOW_UP && confidence < CONFIDENCE_THRESHOLDS.AUTO_FOLLOW_UP,
    patientId: input.patientId, // Safe to log (not PHI)
    timestamp: new Date().toISOString()
  });
  
  // Log detection event for audit (only if userId is provided and matches authenticated user)
  if (userId) {
    try {
      const logger = await getAuditLogger();
      await logger.logEvent({
        type: 'workflow_detection',
        userId, // Use provided userId (must match authenticated user)
        userRole: 'professional',
        patientId: input.patientId,
        metadata: {
          confidence,
          recommendedWorkflow,
          rationale,
          isGrayZone: confidence >= CONFIDENCE_THRESHOLDS.SUGGEST_FOLLOW_UP && confidence < CONFIDENCE_THRESHOLDS.AUTO_FOLLOW_UP,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Log error but don't fail detection if audit logging fails
      console.warn('[Workflow Detection] Failed to log audit event (non-blocking):', error);
    }
  }
  
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


