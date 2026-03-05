# Rollback de los fixes de typecheck (56 → 0 errores)

Si los cambios aplicados para llevar los errores de TypeScript a 0 generan problemas en runtime o comportamiento inesperado, puedes volver atrás así:

## Opción 1: Deshacer el último commit (si ya hiciste commit)

```bash
git log -1 --oneline   # anota el hash del commit "fix typecheck"
git reset --hard HEAD~1
```

## Opción 2: Volver a un commit anterior conocido

```bash
git log --oneline -5
git reset --hard <hash-del-commit-antes-de-los-fixes>
```

## Opción 3: Revertir solo los archivos tocados por los fixes

Los archivos modificados en esta tanda fueron:

- `src/components/consent/ConsentGateScreen.tsx`
- `src/components/consent/ConsentStatusBadge.tsx` (usa `verbalConsentService` con `ConsentVerificationResult` y `verifyConsent`)
- `src/components/consent/index.ts` (export default ConsentGateScreen)
- `src/components/MultimodalTranscriptArea.tsx`
- `src/components/navigation/ProtectedRoute.tsx` (usa `isAuthenticated` del contexto)
- `src/components/PhysicalEvaluationTab.tsx`
- `src/components/SOAPDisplay.tsx`
- `src/components/SOAPReportTab.tsx`
- `src/components/SpendCapManager.tsx`
- `src/components/TokenPackageStore.tsx`
- `src/components/WorkflowGuide.tsx`
- `src/components/workflow/tabs/AnalysisTab.tsx`
- `src/components/workflow/tabs/EvaluationTab.tsx`
- `src/components/workflow/tabs/SOAPTab.tsx`
- `src/context/AuthContext.tsx`
- `src/core/consent/consentJurisdiction.ts`
- `src/core/consent/consentLanguagePolicy.ts`
- `src/core/consent/consentValidation.ts`
- `src/core/soap/PhysicalExamResultBuilder.ts`
- `src/hooks/useDictation.ts`
- `src/hooks/useVerbalConsent.ts`
- `src/repositories/encountersRepo.ts`
- `src/services/analyticsValidationService.ts`
- `src/services/clinicalStateService.ts`
- `src/services/consentServerService.ts`
- `src/services/FileProcessorService.ts`
- `src/services/patientConsentService.ts`
- `src/services/PersistenceService.ts`
- `src/services/referralReportGenerator.ts`
- `src/services/sessionComparisonService.ts`
- `src/services/verbalConsentService.ts`
- `src/services/vertex-ai-soap-service.ts`
- `src/services/workflowRouterService.ts`
- `package.json` / `package-lock.json` (si se instaló `@headlessui/react`)

Para restaurar desde el commit anterior (sustituye `COMMIT_ANTERIOR` por el hash):

```bash
git checkout COMMIT_ANTERIOR -- <cada-archivo-de-la-lista>
```

## Verificación

Después de rollback, ejecuta de nuevo:

```bash
npm run typecheck
```

Es esperado que vuelvan a aparecer los 56 errores si reviertes todos los cambios.
