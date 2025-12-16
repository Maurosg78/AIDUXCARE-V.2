/**
 * Session Type Service
 * 
 * Manages session types, token budgets, and prompt templates
 * for different types of clinical sessions.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

export type SessionType = 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate';

export interface SessionTypeConfig {
  label: string;
  description: string;
  tokenBudget: number;
  icon?: string;
}

/**
 * Token budgets by session type (as per CTO specification)
 */
const TOKEN_BUDGETS: Record<SessionType, number> = {
  'initial': 10,     // 8-12 tokens (comprehensive assessment)
  'followup': 4,     // 3-5 tokens (progress check)
  'wsib': 13,        // 10-15 tokens (injury focus + legal)
  'mva': 15,         // 12-18 tokens (comprehensive + legal)
  'certificate': 6   // 5-8 tokens (specific assessment)
};

/**
 * Session type configuration for UI display
 */
const SESSION_TYPE_CONFIG: Record<SessionType, SessionTypeConfig> = {
  'initial': {
    label: 'Initial Assessment',
    description: 'Comprehensive initial evaluation (8-12 tokens)',
    tokenBudget: 10,
    icon: '📋'
  },
  'followup': {
    label: 'Follow-up',
    description: 'Progress check and treatment continuation (3-5 tokens)',
    tokenBudget: 4,
    icon: '🔄'
  },
  'wsib': {
    label: 'WSIB',
    description: 'Workplace Safety and Insurance Board assessment (10-15 tokens)',
    tokenBudget: 13,
    icon: '🏭'
  },
  'mva': {
    label: 'MVA',
    description: 'Motor Vehicle Accident assessment (12-18 tokens)',
    tokenBudget: 15,
    icon: '🚗'
  },
  'certificate': {
    label: 'Medical Certificate',
    description: 'Specific assessment for certification (5-8 tokens)',
    tokenBudget: 6,
    icon: '📜'
  }
};

/**
 * Session Type Service
 * 
 * Provides utilities for managing session types, token budgets,
 * and generating session-specific prompts.
 */
export class SessionTypeService {
  /**
   * Get token budget for a session type
   * 
   * @param sessionType - The type of session
   * @returns Token budget for the session type
   */
  static getTokenBudget(sessionType: SessionType): number {
    return TOKEN_BUDGETS[sessionType] || TOKEN_BUDGETS.followup;
  }

  /**
   * Get session type configuration for UI display
   * 
   * @param sessionType - The type of session
   * @returns Configuration object with label, description, and token budget
   */
  static getSessionTypeConfig(sessionType: SessionType): SessionTypeConfig {
    return SESSION_TYPE_CONFIG[sessionType] || SESSION_TYPE_CONFIG.followup;
  }

  /**
   * Get all available session types
   * 
   * @returns Array of all session type configurations
   */
  static getAllSessionTypes(): Array<SessionTypeConfig & { value: SessionType }> {
    return Object.entries(SESSION_TYPE_CONFIG).map(([value, config]) => ({
      value: value as SessionType,
      ...config
    }));
  }

  /**
   * Get optimized prompt template for session type
   * 
   * @param sessionType - The type of session
   * @param transcript - The clinical transcript
   * @returns Session-specific prompt template
   */
  static getPromptTemplate(sessionType: SessionType, transcript: string): string {
    const basePrompt = `Generate a comprehensive SOAP note from the following clinical conversation:\n\n${transcript}\n\n`;
    
    switch (sessionType) {
      case 'initial':
        return `${basePrompt}This is an INITIAL ASSESSMENT. Include comprehensive baseline measurements, detailed history, and establish treatment goals. Focus on establishing a complete clinical picture.`;
      
      case 'followup':
        return `${basePrompt}This is a FOLLOW-UP VISIT. Compare progress to previous sessions, note changes in symptoms and function, and update treatment plan. Be concise but thorough.`;
      
      case 'wsib':
        return `${basePrompt}This is a WSIB (Workplace Safety and Insurance Board) ASSESSMENT. Include detailed injury mechanism, work-related factors, functional limitations affecting work capacity, and return-to-work recommendations. Ensure medico-legal clarity.`;
      
      case 'mva':
        return `${basePrompt}This is an MVA (Motor Vehicle Accident) ASSESSMENT. Document mechanism of injury, pre-accident baseline, current functional status, and prognosis. Include legal considerations and detailed injury documentation.`;
      
      case 'certificate':
        return `${basePrompt}This is a MEDICAL CERTIFICATE ASSESSMENT. Focus on specific functional limitations, work restrictions, or activity limitations relevant to the certificate purpose. Be precise and objective.`;
      
      default:
        return basePrompt;
    }
  }

  /**
   * Validate session type selection
   * 
   * @param sessionType - The session type to validate
   * @returns True if valid, false otherwise
   */
  static validateSessionType(sessionType: string): sessionType is SessionType {
    return Object.keys(TOKEN_BUDGETS).includes(sessionType);
  }

  /**
   * Get default session type
   * 
   * @returns Default session type (followup)
   */
  static getDefaultSessionType(): SessionType {
    return 'followup';
  }

  /**
   * Get session type label for display
   * 
   * @param sessionType - The type of session
   * @returns Label string for the session type
   */
  static getSessionTypeLabel(sessionType: SessionType): string {
    return SESSION_TYPE_CONFIG[sessionType]?.label || 'Follow-up';
  }
}

