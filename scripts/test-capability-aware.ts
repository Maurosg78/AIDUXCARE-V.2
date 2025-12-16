#!/usr/bin/env tsx
/**
 * Test script for Professional Capability System
 * 
 * Simulates different professional profiles and validates capability derivation.
 * Run: npx tsx scripts/test-capability-aware.ts
 */

import { deriveProfessionalCapabilities } from '../src/core/ai/capabilities/deriveProfessionalCapabilities';
import type { ProfessionalProfile } from '../src/context/ProfessionalProfileContext';
import { Timestamp } from 'firebase/firestore';

// Helper to create a mock profile
function createMockProfile(overrides: Partial<ProfessionalProfile>): ProfessionalProfile {
  return {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: Timestamp.now(),
    ...overrides,
  };
}

// Test profiles with different characteristics
const testProfiles: Array<{ name: string; profile: ProfessionalProfile }> = [
  {
    name: 'Junior MSK Physio (2 years, private clinic)',
    profile: createMockProfile({
      professionalTitle: 'Physiotherapist',
      specialty: 'Musculoskeletal',
      experienceYears: '2',
      workplace: 'Downtown Sports Clinic',
    }),
  },
  {
    name: 'Mid-level Neuro Physio (5 years, hospital)',
    profile: createMockProfile({
      professionalTitle: 'Physiotherapist',
      specialty: 'Neurological Rehabilitation',
      experienceYears: '5',
      workplace: 'Toronto General Hospital',
    }),
  },
  {
    name: 'Senior Cardio Physio (12 years, clinic)',
    profile: createMockProfile({
      professionalTitle: 'Senior Physiotherapist',
      specialty: 'Cardiopulmonary Rehabilitation',
      experienceYears: '12',
      workplace: 'Cardiac Wellness Clinic',
    }),
  },
  {
    name: 'Junior General Physio (1 year, unknown workplace)',
    profile: createMockProfile({
      professionalTitle: 'Physiotherapist',
      specialty: 'General Practice',
      experienceYears: '1',
      workplace: undefined,
    }),
  },
  {
    name: 'Mid-level MSK Physio (6 years, number type)',
    profile: createMockProfile({
      professionalTitle: 'Physiotherapist',
      specialty: 'MSK',
      experienceYears: 6 as any, // Testing number type (after persistence fix)
      workplace: 'Orthopedic Clinic',
    }),
  },
  {
    name: 'Senior Physio (15 years, MSK specialty)',
    profile: createMockProfile({
      professionalTitle: 'Senior Physiotherapist',
      specialty: 'Orthopedic and Musculoskeletal',
      experienceYears: '15',
      workplace: 'Advanced Sports Medicine Center',
    }),
  },
  {
    name: 'Junior Neuro Physio (0 years - new grad)',
    profile: createMockProfile({
      professionalTitle: 'Physiotherapist',
      specialty: 'Neurological',
      experienceYears: '0',
      workplace: 'Rehabilitation Hospital',
    }),
  },
  {
    name: 'Mid-level General (no specialty specified)',
    profile: createMockProfile({
      professionalTitle: 'Physiotherapist',
      specialty: undefined,
      experienceYears: '4',
      workplace: 'Community Health Center',
    }),
  },
  {
    name: 'Missing profile (null)',
    profile: null as any,
  },
];

// Function to generate capability context string (matching PromptFactory logic)
function generateCapabilityContext(profile: ProfessionalProfile | null | undefined): string {
  const capabilities = deriveProfessionalCapabilities(profile);
  
  if (!profile || (capabilities.seniority === 'mid' && capabilities.domainFocus === 'general')) {
    return '(SKIPPED - default/mid/general)';
  }
  
  const styleMap: Record<string, string> = {
    'guiding': 'guided, explanatory',
    'neutral': 'balanced, evidence-focused',
    'terse': 'concise, non-explanatory, clinically prioritized',
  };
  
  return `[Clinician Capability Context]
- Experience level: ${capabilities.seniority}
- Primary domain: ${capabilities.domainFocus}
- Expected output style: ${styleMap[capabilities.languageTone]}`;
}

// Main test execution
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     TEST: Professional Capability System                       ║');
console.log('║     WO-PROMPT-CAPABILITY-AWARE-01                             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

for (const { name, profile } of testProfiles) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📋 Test: ${name}`);
  console.log(`${'─'.repeat(70)}`);
  
  try {
    const capabilities = deriveProfessionalCapabilities(profile);
    const contextString = generateCapabilityContext(profile);
    
    console.log('\n📊 Derived Capabilities:');
    console.log(`   Seniority:      ${capabilities.seniority}`);
    console.log(`   Domain Focus:   ${capabilities.domainFocus}`);
    console.log(`   Practice:       ${capabilities.practiceContext}`);
    console.log(`   Language Tone:  ${capabilities.languageTone}`);
    
    console.log('\n📝 Capability Context in Prompt:');
    if (contextString.startsWith('(SKIPPED')) {
      console.log(`   ${contextString}`);
    } else {
      console.log(contextString);
    }
    
    // Validation checks
    const validations: string[] = [];
    
    // Check seniority rules
    if (profile) {
      const expYears = typeof profile.experienceYears === 'string' 
        ? parseInt(profile.experienceYears, 10) 
        : (profile.experienceYears ?? 0);
      
      if (!Number.isFinite(expYears) || expYears < 3) {
        if (capabilities.seniority !== 'junior') {
          validations.push(`❌ Expected 'junior' for ${expYears} years, got '${capabilities.seniority}'`);
        } else {
          validations.push(`✅ Seniority correct: ${capabilities.seniority} (${expYears} years)`);
        }
      } else if (expYears >= 8) {
        if (capabilities.seniority !== 'senior') {
          validations.push(`❌ Expected 'senior' for ${expYears} years, got '${capabilities.seniority}'`);
        } else {
          validations.push(`✅ Seniority correct: ${capabilities.seniority} (${expYears} years)`);
        }
      } else {
        validations.push(`✅ Seniority correct: ${capabilities.seniority} (${expYears} years)`);
      }
      
      // Check domain detection
      const specialty = (profile.specialty || '').toLowerCase();
      if (specialty.includes('neuro') && capabilities.domainFocus !== 'neuro') {
        validations.push(`❌ Expected 'neuro' for specialty '${profile.specialty}', got '${capabilities.domainFocus}'`);
      } else if (specialty.includes('cardio') && capabilities.domainFocus !== 'cardio') {
        validations.push(`❌ Expected 'cardio' for specialty '${profile.specialty}', got '${capabilities.domainFocus}'`);
      } else if (specialty.includes('msk') || specialty.includes('ortho') || specialty.includes('musculoskeletal')) {
        if (capabilities.domainFocus !== 'msk') {
          validations.push(`❌ Expected 'msk' for specialty '${profile.specialty}', got '${capabilities.domainFocus}'`);
        } else {
          validations.push(`✅ Domain focus correct: ${capabilities.domainFocus}`);
        }
      }
      
      // Check language tone mapping
      if (capabilities.seniority === 'junior' && capabilities.languageTone !== 'guiding') {
        validations.push(`❌ Expected 'guiding' for junior, got '${capabilities.languageTone}'`);
      } else if (capabilities.seniority === 'senior' && capabilities.languageTone !== 'terse') {
        validations.push(`❌ Expected 'terse' for senior, got '${capabilities.languageTone}'`);
      } else if (capabilities.seniority === 'mid' && capabilities.languageTone !== 'neutral') {
        validations.push(`❌ Expected 'neutral' for mid, got '${capabilities.languageTone}'`);
      } else {
        validations.push(`✅ Language tone correct: ${capabilities.languageTone}`);
      }
    }
    
    if (validations.length > 0) {
      console.log('\n🔍 Validations:');
      validations.forEach(v => console.log(`   ${v}`));
      const hasErrors = validations.some(v => v.startsWith('❌'));
      if (hasErrors) {
        failed++;
      } else {
        passed++;
      }
    } else {
      passed++;
    }
    
  } catch (error) {
    console.error(`\n❌ ERROR: ${error}`);
    failed++;
  }
}

console.log(`\n${'═'.repeat(70)}`);
console.log('📊 SUMMARY');
console.log(`${'═'.repeat(70)}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${testProfiles.length}\n`);

if (failed === 0) {
  console.log('🎉 All tests passed! The capability system is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the output above.\n');
  process.exit(1);
}

