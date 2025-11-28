# Professional Name Display Debug

## Problem

The header is not showing "PT. Mauricio Sobarzo" - the professional name is not being displayed.

## Root Cause Analysis

### Expected Display Logic

The `deriveClinicianDisplayName` function checks in this order:
1. `profile?.preferredSalutation` + `profile?.lastNamePreferred` → `"PT. Sobarzo"`
2. `profile?.fullName` → `"Mauricio Sobarzo"`
3. `profile?.displayName` → fallback
4. `user?.displayName` → fallback
5. `profile?.email` → fallback
6. `user?.email` → fallback
7. `"Dr. Smith"` → default

### Current Implementation

**Location**: `src/pages/ProfessionalWorkflowPage.tsx` (lines 322-325, 4057-4061)

**Header Display**:
```typescript
{clinicianDisplayName && (
  <div className="flex items-center gap-2 text-slate-700">
    <Users className="w-4 h-4 text-slate-500" />
    <span className="font-medium">{clinicianDisplayName}</span>
    {clinicName && <span className="text-slate-500">· {clinicName}</span>}
  </div>
)}
```

## Debug Logging Added ✅

### Professional Profile Debug
**Location**: `src/pages/ProfessionalWorkflowPage.tsx` (lines 271-277)

```typescript
console.log('🔍 [DEBUG] Professional Profile:', {
  hasProfile: !!professionalProfile,
  profile: professionalProfile,
  user: user ? { email: user.email, displayName: user.displayName } : null
});
```

### Display Name Derivation Debug
**Location**: `src/pages/ProfessionalWorkflowPage.tsx` (lines 322-335)

```typescript
const clinicianDisplayName = useMemo(
  () => {
    const name = deriveClinicianDisplayName(professionalProfile, user);
    console.log('🔍 [DEBUG] clinicianDisplayName derived:', name, {
      preferredSalutation: professionalProfile?.preferredSalutation,
      lastNamePreferred: professionalProfile?.lastNamePreferred,
      fullName: professionalProfile?.fullName,
      displayName: professionalProfile?.displayName,
      userDisplayName: user?.displayName,
      userEmail: user?.email
    });
    return name;
  },
  [professionalProfile, user]
);
```

## Expected Console Output

### If Profile Has Data:
```
🔍 [DEBUG] Professional Profile: {
  hasProfile: true,
  profile: {
    preferredSalutation: "PT.",
    lastNamePreferred: "Sobarzo",
    fullName: "Mauricio Sobarzo",
    ...
  },
  user: { email: "mauricio@aiduxcare.com", displayName: null }
}
🔍 [DEBUG] clinicianDisplayName derived: "PT. Sobarzo" {
  preferredSalutation: "PT.",
  lastNamePreferred: "Sobarzo",
  fullName: "Mauricio Sobarzo",
  ...
}
```

### If Profile Missing:
```
🔍 [DEBUG] Professional Profile: {
  hasProfile: false,
  profile: null,
  user: { email: "mauricio@aiduxcare.com", displayName: null }
}
🔍 [DEBUG] clinicianDisplayName derived: "mauricio" {
  preferredSalutation: undefined,
  lastNamePreferred: undefined,
  fullName: undefined,
  ...
}
```

## Possible Issues

1. **Profile Not Loaded**: `professionalProfile` is `null` or `undefined`
2. **Profile Missing Fields**: Profile exists but doesn't have `preferredSalutation` or `lastNamePreferred`
3. **Conditional Rendering**: `clinicianDisplayName &&` is falsy
4. **Context Not Providing**: `useProfessionalProfileContext` not returning profile

## Next Steps

1. **Check Console Output**: Look for debug logs to see what data is available
2. **Verify Profile Data**: Check if `professionalProfile` has the expected fields
3. **Check Context**: Verify `ProfessionalProfileContext` is providing data correctly
4. **Fallback Display**: If profile missing, show email or user name as fallback

## Files Modified

1. ✅ `src/pages/ProfessionalWorkflowPage.tsx`:
   - Added professional profile debug logging (lines 271-277)
   - Added display name derivation debug logging (lines 322-335)

---

**Date**: November 27, 2025  
**Status**: ✅ **DEBUG LOGGING ADDED - READY FOR TESTING**

