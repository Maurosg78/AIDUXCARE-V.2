/**
 * Resolve Prompt Brain Version
 * 
 * Determines which version of Prompt Brain to use based on:
 * 1. Query parameter ?pb=v3
 * 2. Environment variable VITE_PROMPT_BRAIN_VERSION=v3
 * 3. Default: v2
 * 
 * SSR-safe: caller should pass search string explicitly.
 * In browser: const search = typeof window !== "undefined" ? window.location.search : "";
 */

export function resolvePromptBrainVersion(params: {
    search?: string; // window.location.search (caller should extract safely)
    envVersion?: string; // import.meta.env.VITE_PROMPT_BRAIN_VERSION
}): "v2" | "v3" {
    const q = params.search ?? "";
    if (/\bpb=v3\b/i.test(q)) return "v3";
    const ev = (params.envVersion ?? "").toLowerCase().trim();
    if (ev === "v3") return "v3";
    return "v2";
}

