/**
 * Prompt Intent Types for v3
 */

export type Intent =
    | "ANALYZE"
    | "DECIDE"
    | "DOCUMENT"
    | "SUGGEST";

export type IntentFlags = {
    intent: Intent;
    visitType: "initial" | "follow-up";
    analysisLevel?: "full" | "optimized";
    promptBrainVersion: "v2" | "v3";
};
