/**
 * CPO (College of Physiotherapists of Ontario) Professional Standards
 * Source: CPO Professional Practice Standards
 * Last Updated: October 2025
 * Update Frequency: Annual
 */

export interface CPOStandard {
  standardId: string;
  category: 'assessment' | 'treatment' | 'documentation' | 'scope';
  title: string;
  requirement: string;
  clinicalApplication: string;
  complianceChecks: string[];
  lastUpdated: string;
  sourceDocument: string;
}

export const CPO_STANDARDS: CPOStandard[] = [
  {
    standardId: "AS-001",
    category: "assessment",
    title: "Comprehensive Assessment Requirement",
    requirement: "Physiotherapists must conduct thorough assessments including history, physical examination, and clinical reasoning",
    clinicalApplication: "Initial assessment must include minimum components per CPO standards",
    complianceChecks: [
      "History taking completed",
      "Physical examination performed",
      "Clinical reasoning documented",
      "Differential diagnosis considered"
    ],
    lastUpdated: "2025-10-21",
    sourceDocument: "CPO Professional Practice Standards 2025"
  },
  {
    standardId: "TR-002",
    category: "treatment",
    title: "Evidence-Based Treatment Planning",
    requirement: "Treatment interventions must be based on current evidence and within scope of practice",
    clinicalApplication: "All treatment recommendations must have evidence base",
    complianceChecks: [
      "Evidence citation for interventions",
      "Scope of practice verification",
      "Patient goals integration",
      "Outcome measures identified"
    ],
    lastUpdated: "2025-10-21",
    sourceDocument: "CPO Treatment Guidelines 2025"
  }
];
