# TypeScript Fixes Needed After Demo

## Critical Files to Fix:

1. **Types to properly define:**
   - `/src/types/patient.ts` - Define complete PatientData interface
   - Component props in `/src/components/*`
   - Service method parameters

2. **Services to implement:**
   - `AudioCaptureServiceReal.ts` - Real implementation
   - `WebSpeechSTTService.ts` - Real implementation

3. **Clean up:**
   - Remove `.backup` files
   - Fix all `any` types
   - Restore strict TypeScript config

## Commands to restore:
```bash
# Restore hooks
mv .husky/pre-push.backup .husky/pre-push

# Restore strict TypeScript
mv tsconfig.json.strict tsconfig.json

# Fix all types properly
npm run typecheck
```
