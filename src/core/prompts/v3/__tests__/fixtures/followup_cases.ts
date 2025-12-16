/**
 * Golden Follow-up Cases for DECIDE Testing
 * 
 * Clinical fixtures representing common follow-up scenarios.
 * Used for testing prompt generation and contract validation.
 */

export const FOLLOWUP_DECIDE_CASES = [
  {
    name: "Lateral knee pain - load sensitive",
    context: {
      chiefComplaint: "lateral knee pain after long walking; cycling tolerated",
      keyFindings: ["walking aggravates", "cycling ok", "pain lateral joint line/ITB region"],
      painScale: "3/10",
    },
  },
  {
    name: "Shoulder pain - overhead provocation",
    context: {
      chiefComplaint: "shoulder pain with overhead reach; night discomfort mild",
      keyFindings: ["overhead provokes", "no acute trauma", "pain improves with rest"],
      painScale: "4/10",
    },
  },
  {
    name: "Low back pain - flexion intolerance",
    context: {
      chiefComplaint: "low back pain worse with sitting and flexion",
      keyFindings: ["sitting worsens", "walking helps", "no red flags reported"],
      painScale: "5/10",
    },
  },
] as const;

