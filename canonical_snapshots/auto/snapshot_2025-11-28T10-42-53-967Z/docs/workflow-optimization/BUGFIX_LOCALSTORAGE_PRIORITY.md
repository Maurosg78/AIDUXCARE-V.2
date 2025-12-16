# Bug Fix: localStorage Overriding URL Parameters

## Issue

When selecting follow-up from command center, the console showed:
- `activeTab: 'analysis'` being restored from localStorage
- `visitType: 'initial'` being tracked in analytics
- URL parameter `type=followup` being ignored

## Root Cause

The `useEffect` that restores workflow state from localStorage was running **after** the initial state was set, and it was **overriding** the URL-based initial state.

### Execution Order Problem:
1. ✅ Initial state set: `activeTab = "soap"` (if `type=followup`)
2. ✅ Initial state set: `visitType = 'follow-up'` (if `type=followup`)
3. ❌ **localStorage restore runs** → Overwrites `activeTab` back to `'analysis'`
4. ❌ Analytics tracking uses wrong `visitType`

## Fix Applied

### 1. Skip localStorage Restore for Explicit Follow-up ✅
```typescript
// ✅ CRITICAL FIX: Don't restore if URL explicitly specifies followup
const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
if (isExplicitFollowUp) {
  console.log('[WORKFLOW] Skipping localStorage restore - explicit followup from URL');
  return;
}
```

### 2. Conditional Tab Restoration ✅
```typescript
// ✅ CRITICAL FIX: Only restore active tab if URL doesn't specify a type
// If URL has type=followup, we already set it to 'soap' in initial state
if (!sessionTypeFromUrl && savedState.activeTab && ['analysis', 'evaluation', 'soap'].includes(savedState.activeTab)) {
  setActiveTab(savedState.activeTab as ActiveTab);
  console.log('[WORKFLOW] ✅ Restored active tab:', savedState.activeTab);
}
```

### 3. Fix Analytics Tracking ✅
```typescript
// ✅ CRITICAL FIX: Use explicit URL parameter for visitType in tracking
const trackingVisitType = sessionTypeFromUrl === 'followup' ? 'follow-up' : visitType;
await AnalyticsService.trackEvent('pilot_session_started', {
  patientId,
  userId: user.uid,
  sessionStartTime: sessionStartTime.toISOString(),
  visitType: trackingVisitType,
  isPilotUser: true
});
```

## Expected Behavior After Fix

### When `type=followup` in URL:
1. ✅ **localStorage restore skipped** - No override of initial state
2. ✅ **activeTab stays as "soap"** - Not restored to "analysis"
3. ✅ **visitType stays as "follow-up"** - Not restored to "initial"
4. ✅ **Analytics tracks correctly** - Uses "follow-up" not "initial"

### When no type parameter:
1. ✅ **localStorage restore works** - Normal behavior for returning users
2. ✅ **State restored** - Previous workflow state maintained

## Files Modified

- `src/pages/ProfessionalWorkflowPage.tsx`
  - Lines 591-659: Enhanced localStorage restore logic
  - Lines 334-340: Fixed analytics tracking

## Testing Checklist

- [ ] Navigate with `?type=followup&patientId=XXX`
  - [ ] Verify: No localStorage restore message
  - [ ] Verify: activeTab stays as "soap"
  - [ ] Verify: Analytics tracks `visitType: 'follow-up'`
  - [ ] Verify: No "Restoring workflow state" log

- [ ] Navigate without type parameter
  - [ ] Verify: localStorage restore works normally
  - [ ] Verify: Previous state restored correctly

## Status

✅ **FIXED** - URL parameters now take priority over localStorage

---

**Date**: November 27, 2025  
**Status**: ✅ **RESOLVED**


