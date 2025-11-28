# Vite Stability Patch v3.0 (DEFINITIVE)

**Date:** 2025-11-14  
**Status:** ✅ Active  
**Purpose:** Eliminate HMR loops and page reloads caused by watchers monitoring tests, snapshots, fixtures, and deprecated code

---

## Problem

Vite was watching thousands of files it shouldn't watch:
- `__tests__/`, `__fixtures__/`, `__snapshots__/` directories
- Test files (`*.test.ts`, `*.spec.ts`)
- Deprecated code (`_deprecated/`)
- Snapshot files
- Backup files (`.bak`, `.orig`, `.rej`)

This caused **cascading page reloads** every few seconds, even when no code was being edited.

---

## Solution

Three-layer exclusion strategy:

1. **Vite config** (`vite.config.ts`): Excludes all test/snapshot/fixture patterns from file watching
2. **Vitest config** (`vitest.config.ts`): Prevents Vitest from watching non-test files
3. **VSCode settings** (`.vscode/settings.json`): Disables aggressive TypeScript/VSCode watchers

---

## Files Included

- `vite.config.ts` - Vite dev server watch exclusions
- `vitest.config.ts` - Vitest watch exclusions
- `.vscode/settings.json` - VSCode/TypeScript watcher configuration

---

## What Gets Ignored

### Tests & Test Infrastructure
- `**/__tests__/**`
- `**/__test__/**`
- `**/test/**`
- `**/tests/**`
- `**/__fixtures__/**`
- `**/fixtures/**`
- `**/__snapshots__/**`
- `**/snapshots/**`
- `**/*.test.ts`, `**/*.spec.ts` (all variants)

### Deprecated Code
- `**/_deprecated/**`
- `**/src/_deprecated/**`

### Build Artifacts & Backups
- `**/*.bak`, `**/*.backup`, `**/*.orig`, `**/*.rej`
- `**/dist/**`, `**/coverage/**`
- `**/canonical_snapshots/**`

### Documentation
- `**/docs/**`

### Config Files (that trigger reloads)
- `**/tailwind.config.*`
- `**/tsconfig*.json`
- `**/.eslintrc*`
- `**/.prettierrc*`

---

## How to Apply

If these files get overwritten or removed:

1. Copy all files from this snapshot to project root
2. Restart Vite dev server: `pkill -f vite && npm run dev`
3. Reload VSCode window: `Cmd+Shift+P` → "Reload Window"

---

## Verification

After applying, you should **NOT** see:
- ❌ `[vite] page reload src/core/**/__tests__/**`
- ❌ `[vite] page reload src/core/**/__fixtures__/**`
- ❌ `[vite] page reload src/_deprecated/**`
- ❌ Cascading reloads every few seconds

You **SHOULD** see:
- ✅ Only reloads when editing actual source files in `src/`
- ✅ Stable dev server
- ✅ Fast HMR for legitimate changes

---

## Important Notes

⚠️ **DO NOT** remove these exclusions without understanding the impact.

⚠️ **DO NOT** add test files to watched directories - they belong in `__tests__/` which is excluded.

⚠️ If you need to watch test files during development, use Vitest's watch mode explicitly: `npm run test:watch`

---

## Technical Details

### Vite Watch Configuration
- `followSymlinks: false` - Prevents following symlinks
- `usePolling: false` - Uses native file system events (faster)
- `interval: 1000` - Polling interval (if polling enabled)
- `binaryInterval: 3000` - Binary file polling interval

### TypeScript Server
- `watchFile: "off"` - Disables file watching
- `watchDirectory: "off"` - Disables directory watching
- Prevents TypeScript from triggering Vite reloads

---

## Maintenance

If new patterns emerge that cause reloads:

1. Add pattern to `ignoredWatchGlobs` in `vite.config.ts`
2. Add pattern to `watchExclude` in `vitest.config.ts`
3. Add pattern to `files.watcherExclude` in `.vscode/settings.json`
4. Update this README
5. Create new snapshot with incremented version

---

**This patch is CRITICAL for development stability. Do not remove without CTO approval.**

