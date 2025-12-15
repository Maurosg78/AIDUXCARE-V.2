/**
 * Contract Validator for Prompt Output v3
 */

import { CONTRACTS } from "../types/contracts";
import type { Intent } from "../types/intent";

export type ContractValidationResult = {
    ok: boolean;
    errors: string[];
};

const normalize = (s: string) => s.toLowerCase().trim();

const extractBullets = (text: string): string[] => {
    // Accept "- " or "• " or "* "
    return text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => /^(-|•|\*)\s+/.test(l))
        .map((l) => l.replace(/^(-|•|\*)\s+/, "").trim())
        .filter(Boolean);
};

export function validateContract(intent: Intent, output: string): ContractValidationResult {
    const c = CONTRACTS[intent];
    const errors: string[] = [];
    const out = output ?? "";

    if (c.maxTotalChars && out.length > c.maxTotalChars) {
        errors.push(`maxTotalChars exceeded: ${out.length} > ${c.maxTotalChars}`);
    }

    if (c.forbiddenPhrases?.length) {
        const n = normalize(out);
        for (const phrase of c.forbiddenPhrases) {
            if (n.includes(phrase)) errors.push(`forbidden phrase detected: "${phrase}"`);
        }
    }

    if (c.maxBullets || c.maxCharsPerBullet) {
        const bullets = extractBullets(out);

        // For DECIDE, require at least 1 bullet
        if (intent === "DECIDE" && bullets.length < 1) {
            errors.push(`DECIDE output must contain at least 1 bullet (found 0)`);
        }

        if (c.maxBullets && bullets.length > c.maxBullets) {
            errors.push(`maxBullets exceeded: ${bullets.length} > ${c.maxBullets}`);
        }

        if (c.maxCharsPerBullet) {
            bullets.forEach((b, idx) => {
                if (b.length > c.maxCharsPerBullet!) {
                    errors.push(`bullet[${idx}] too long: ${b.length} > ${c.maxCharsPerBullet}`);
                }
            });
        }
    }

    return { ok: errors.length === 0, errors };
}
