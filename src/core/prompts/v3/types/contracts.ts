/**
 * Output Contract Types for v3
 */

import type { Intent } from "./intent";

export type OutputContract = {
    intent: Intent;
    maxBullets?: number;
    maxCharsPerBullet?: number;
    maxTotalChars?: number;
    forbiddenPhrases?: string[];
};

export const CONTRACTS: Record<Intent, OutputContract> = {
    ANALYZE: { intent: "ANALYZE", maxBullets: 5, maxCharsPerBullet: 140 },
    DECIDE: {
        intent: "DECIDE",
        maxBullets: 6,
        maxCharsPerBullet: 120,
        forbiddenPhrases: [
            "as an ai",
            "i can't",
            "i cannot",
            "cannot diagnose",
            "consult a professional",
            "seek medical advice",
            "i'm not a doctor",
        ],
    },
    DOCUMENT: { intent: "DOCUMENT", maxTotalChars: 900 },
    SUGGEST: { intent: "SUGGEST", maxBullets: 5, maxCharsPerBullet: 140 },
};
