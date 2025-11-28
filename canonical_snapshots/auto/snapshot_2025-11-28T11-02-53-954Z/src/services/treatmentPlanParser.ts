/**
 * Treatment Plan Parser Service
 * 
 * Extracts scheduling information from SOAP note treatment plans
 * to help physiotherapists automatically schedule sessions.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

export interface ParsedTreatmentPlan {
  frequencyPerWeek: number | null; // e.g., 2 (sessions per week)
  durationWeeks: number | null; // e.g., 4 (weeks)
  totalSessions: number | null; // Calculated: frequencyPerWeek * durationWeeks
  followUpDays: number | null; // e.g., 7 (days until follow-up)
  followUpDate: Date | null; // Calculated follow-up date
  rawText: string; // Original plan text for reference
}

/**
 * Parses treatment plan text to extract scheduling information
 */
export function parseTreatmentPlan(planText: string): ParsedTreatmentPlan {
  if (!planText || typeof planText !== 'string') {
    return {
      frequencyPerWeek: null,
      durationWeeks: null,
      totalSessions: null,
      followUpDays: null,
      followUpDate: null,
      rawText: planText || '',
    };
  }

  const text = planText.toLowerCase();
  
  // Extract frequency (e.g., "2 times per week", "twice weekly", "2x/week")
  const frequencyPerWeek = extractFrequency(text);
  
  // Extract duration (e.g., "for 4 weeks", "over 4 weeks", "4-week period")
  const durationWeeks = extractDuration(text);
  
  // Calculate total sessions
  const totalSessions = 
    frequencyPerWeek !== null && durationWeeks !== null
      ? frequencyPerWeek * durationWeeks
      : null;
  
  // Extract follow-up information (e.g., "in 1 week", "scheduled in 1 week")
  const followUpDays = extractFollowUpDays(text);
  
  // Calculate follow-up date (if follow-up days found)
  const followUpDate = followUpDays !== null
    ? new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000)
    : null;

  return {
    frequencyPerWeek,
    durationWeeks,
    totalSessions,
    followUpDays,
    followUpDate,
    rawText: planText,
  };
}

/**
 * Extracts frequency per week from text
 */
function extractFrequency(text: string): number | null {
  // Pattern 1: "2 times per week", "3 times per week"
  const timesPerWeekMatch = text.match(/(\d+)\s*times?\s*per\s*week/i);
  if (timesPerWeekMatch) {
    return parseInt(timesPerWeekMatch[1], 10);
  }
  
  // Pattern 2: "twice weekly", "thrice weekly"
  if (text.match(/twice\s*weekly/i)) return 2;
  if (text.match(/thrice\s*weekly/i)) return 3;
  
  // Pattern 3: "2x/week", "3x/week", "2x per week"
  const xPerWeekMatch = text.match(/(\d+)x\s*(?:per\s*)?week/i);
  if (xPerWeekMatch) {
    return parseInt(xPerWeekMatch[1], 10);
  }
  
  // Pattern 4: "weekly", "bi-weekly", "semi-weekly"
  if (text.match(/bi-?weekly|semi-?weekly/i)) return 2;
  if (text.match(/weekly/i) && !text.match(/bi-?weekly|semi-?weekly/i)) return 1;
  
  return null;
}

/**
 * Extracts duration in weeks from text
 */
function extractDuration(text: string): number | null {
  // Pattern 1: "for 4 weeks", "over 4 weeks", "during 4 weeks"
  const forWeeksMatch = text.match(/(?:for|over|during|within)\s*(\d+)\s*weeks?/i);
  if (forWeeksMatch) {
    return parseInt(forWeeksMatch[1], 10);
  }
  
  // Pattern 2: "4-week period", "4 week period", "4-week treatment"
  const weekPeriodMatch = text.match(/(\d+)[-\s]week\s*(?:period|treatment|plan|program)/i);
  if (weekPeriodMatch) {
    return parseInt(weekPeriodMatch[1], 10);
  }
  
  // Pattern 3: "4 weeks" (standalone, near frequency info)
  const weeksMatch = text.match(/(\d+)\s*weeks?(?:\s*period|\s*treatment|\s*plan)?/i);
  if (weeksMatch) {
    return parseInt(weeksMatch[1], 10);
  }
  
  return null;
}

/**
 * Extracts follow-up days from text
 */
function extractFollowUpDays(text: string): number | null {
  // Pattern 1: "in 1 week", "scheduled in 1 week", "follow-up in 1 week"
  const inWeekMatch = text.match(/(?:follow-?up|appointment|scheduled).*?in\s*(\d+)\s*week/i);
  if (inWeekMatch) {
    return parseInt(inWeekMatch[1], 10) * 7; // Convert weeks to days
  }
  
  // Pattern 2: "in 7 days", "scheduled in 7 days"
  const inDaysMatch = text.match(/(?:follow-?up|appointment|scheduled).*?in\s*(\d+)\s*days?/i);
  if (inDaysMatch) {
    return parseInt(inDaysMatch[1], 10);
  }
  
  // Pattern 3: "1 week" (near follow-up context)
  const weekFollowUpMatch = text.match(/follow-?up.*?(\d+)\s*week/i);
  if (weekFollowUpMatch) {
    return parseInt(weekFollowUpMatch[1], 10) * 7;
  }
  
  return null;
}

/**
 * Generates session dates based on parsed treatment plan
 */
export function generateSessionDates(
  parsedPlan: ParsedTreatmentPlan,
  startDate: Date = new Date()
): Date[] {
  if (!parsedPlan.frequencyPerWeek || !parsedPlan.durationWeeks) {
    return [];
  }

  const sessions: Date[] = [];
  const totalSessions = parsedPlan.totalSessions || parsedPlan.frequencyPerWeek * parsedPlan.durationWeeks;
  
  // Calculate days between sessions (e.g., 2x/week = every 3.5 days, round to 3 or 4)
  const daysBetweenSessions = Math.floor(7 / parsedPlan.frequencyPerWeek);
  
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < totalSessions; i++) {
    sessions.push(new Date(currentDate));
    
    // Move to next session date
    if (i < totalSessions - 1) {
      currentDate.setDate(currentDate.getDate() + daysBetweenSessions);
    }
  }
  
  return sessions;
}



