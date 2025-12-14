# CSS Minify Warning (P2)

**Date:** 2025-12-14  
**Status:** P2 / Known warning  
**Impact:** None - does not block build or CI

## Observation

Build emits:
```
warnings when minifying css:
▲ [WARNING] Expected identifier but found "-" [css-syntax-error]
    <stdin>:3063:2:
      3063 │   -: T.;
           ╵   ^
```

## Analysis

- Observed only during esbuild/Vite CSS minification step.
- Not reproducible via source grep; likely minifier artefact.
- Does NOT break build or CI; output is generated successfully.
- No CSS styling issues observed in production.

## Status

**P2 / Known warning.** Investigate only if it becomes an error or affects styling.

## Investigation Triggers

Only investigate further if:
1. Warning becomes an error in another environment/CI.
2. CSS appears broken (missing classes or truncated rules) in production.
3. Warning expands to many locations (real noise).

If any of these occur, use `build.cssMinify: false` in a diagnostic branch to trace the exact selector.

