/**
 * PHIPA (Personal Health Information Protection Act) - Ontario
 * Source: Ontario Regulation 329/04 under PHIPA
 * Last Updated: October 2025
 * Update Frequency: Quarterly
 */

export interface PHIPARegulation {
  section: string;
  title: string;
  requirement: string;
  clinicalRelevance: string;
  complianceActions: string[];
  lastUpdated: string;
  sourceReference: string;
}

export const PHIPA_REGULATIONS: PHIPARegulation[] = [
  {
    section: "6(1)",
    title: "Consent for Collection",
    requirement: "No person shall collect personal health information unless consent obtained",
    clinicalRelevance: "All patient assessments require documented consent",
    complianceActions: [
      "Document verbal/written consent before assessment",
      "Explain purpose of information collection",
      "Provide withdrawal options"
    ],
    lastUpdated: "2025-10-21",
    sourceReference: "Ontario Regulation 329/04, s.6(1)"
  },
  {
    section: "37",
    title: "Documentation Requirements",
    requirement: "Records must be accurate, complete, and maintained securely",
    clinicalRelevance: "Clinical notes must meet PHIPA documentation standards",
    complianceActions: [
      "Ensure assessment accuracy",
      "Complete documentation within 24 hours",
      "Secure storage protocols"
    ],
    lastUpdated: "2025-10-21",
    sourceReference: "PHIPA, s.37 - Record Keeping"
  }
];
