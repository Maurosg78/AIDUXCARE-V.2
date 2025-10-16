
## TD-002: Branch Cleanup (Post-Beta)

**Date Identified:** October 16, 2025  
**Priority:** P3 (Low)  
**Impact:** Cosmetic  
**Blocking:** No  

### Description
Repository contains ~150+ stale branches from CI experiments, old features, and bot activity.

### Current State
- Local branches: ~60
- Remote branches: ~150+
- Active branches: ~10-15
- Stale branches: ~140+

### Categories
- **CI experiments:** `ci/fix-*`, `ci/wrapper-*`, `ci/fresh-id-*`
- **Bot branches:** `bot/*`, `cursor/*`
- **Backup branches:** `backup/*`, `recover/*`, `safety/*`
- **Old PRs:** `pr-*`, `pr[0-9]*`
- **Merged features:** Already merged to main

### Impact
- �� Developer experience (cluttered git output)
- 🟢 No impact on product functionality
- 🟢 No impact on beta testers
- 🟢 No impact on CI/CD

### Mitigation
**Postponed to post-beta maintenance sprint.**

Auto-delete on merge is enabled, preventing future accumulation.

### Resolution Plan
1. Archive important branches
2. Delete stale branches (local + remote)
3. Document branch naming convention
4. Update PR template

**Estimated Effort:** 30-60 minutes  
**Target Date:** November 2025 (post-beta)

---

**Status:** Tracked  
**Issue:** #[issue-number]  
**Market:** CA · **Language:** en-CA
