# Pilot Readout

Generated: 2025-12-14T12:41:13+01:00

## 1) Repo & toolchain
```
v20.19.5
9.15.9
ea206779

Git status:
 M .github/workflows/ci.yml
 M eslint.config.js
 M package.json
 M src/services/dataDeidentificationService.ts
 M vite.config.ts
 M vitest.config.ts
?? ANALISIS-500-ERROR.md
?? FIX-500-ERROR.md
?? FIX-FIREBASE-UTIL.md
?? SOLUCION-500-COMPLETA.md
?? WO-PILOT-STAB-05-COMPLETADO.md
?? pilot_readout.md
?? scripts/pilot_readout.sh
?? scripts/pilot_readout_fixed.sh
?? src/core/ai/promptBrain/
```

## 2) Commands (evidence)
```
=== pnpm install --frozen-lockfile ===

> aiduxcare-v2@0.1.0 check:env
> node scripts/check-env.cjs

📄 Cargando variables desde: /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/.env.local
✅ Configuración Firebase validada correctamente.
   VITE_FIREBASE_PROJECT_ID: aiduxcare-v2-uat-dev
   VITE_FIREBASE_API_KEY: [PROTEGIDO]
   ✅ Sistema preparado para arquitectura Firebase
Done in 959ms using pnpm v9.15.9

=== pnpm run lint ===

> aiduxcare-v2@0.1.0 lint /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean
> eslint .

(node:56839) ESLintEnvWarning: /* eslint-env */ comments are no longer recognized when linting with flat config and will be reported as errors as of v10.0.0. Replace them with /* global */ comments or define globals in your config file. See https://eslint.org/docs/latest/use/configure/migration-guide#eslint-env-configuration-comments for details. Found in /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/scripts/generateAndreaMetrics.js at line 1.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:56839) ESLintEnvWarning: /* eslint-env */ comments are no longer recognized when linting with flat config and will be reported as errors as of v10.0.0. Replace them with /* global */ comments or define globals in your config file. See https://eslint.org/docs/latest/use/configure/migration-guide#eslint-env-configuration-comments for details. Found in /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/scripts/runPatientScript.js at line 2.
(node:56839) ESLintEnvWarning: /* eslint-env */ comments are no longer recognized when linting with flat config and will be reported as errors as of v10.0.0. Replace them with /* global */ comments or define globals in your config file. See https://eslint.org/docs/latest/use/configure/migration-guide#eslint-env-configuration-comments for details. Found in /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/scripts/run_metrics_migration.js at line 2.

/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/src/services/dataDeidentificationService.ts
  39:24  error  Unnecessary escape character: \/  no-useless-escape
  39:27  error  Unnecessary escape character: \-  no-useless-escape
  39:41  error  Unnecessary escape character: \/  no-useless-escape
  39:44  error  Unnecessary escape character: \-  no-useless-escape

✖ 4 problems (4 errors, 0 warnings)

 ELIFECYCLE  Command failed with exit code 1.
Lint timeout/failed

=== pnpm run build ===

> aiduxcare-v2@0.1.0 build /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean
> vite build

vite v5.4.20 building for production...
[baseline-browser-mapping] The data in this module is over two months old.  To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`
transforming...
✓ 31 modules transformed.
x Build failed in 1.18s
error during build:
[vite]: Rollup failed to resolve import "@firebase/util" from "/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/@firebase+auth@1.10.8_@firebase+app@0.13.2/node_modules/@firebase/auth/dist/esm2017/index.js".
This is most likely unintended because it can break your application at runtime.
If you do want to externalize this module explicitly add it to
`build.rollupOptions.external`
    at viteWarn (file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/vite@5.4.20_@types+node@22.18.10/node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:65854:17)
    at onwarn (file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.20_@types+node@22.18.10_/node_modules/@vitejs/plugin-react/dist/index.js:90:7)
    at onRollupWarning (file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/vite@5.4.20_@types+node@22.18.10/node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:65884:5)
    at onwarn (file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/vite@5.4.20_@types+node@22.18.10/node_modules/vite/dist/node/chunks/dep-D_zLpgQd.js:65549:7)
    at file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/rollup@4.52.3/node_modules/rollup/dist/es/shared/node-entry.js:20950:13
    at Object.logger [as onLog] (file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/rollup@4.52.3/node_modules/rollup/dist/es/shared/node-entry.js:22822:9)
    at ModuleLoader.handleInvalidResolvedId (file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/rollup@4.52.3/node_modules/rollup/dist/es/shared/node-entry.js:21566:26)
    at file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2-clean/node_modules/.pnpm/rollup@4.52.3/node_modules/rollup/dist/es/shared/node-entry.js:21524:26
 ELIFECYCLE  Command failed with exit code 1.
Build timeout/failed
```

## 3) Crash scan (frontend)
```
No crash patterns found
```

## 4) Known blockers (from logs)

### 4.1 TranscriptArea null access
```
src/pages/ProfessionalWorkflowPage.tsx:71:import TranscriptArea from "../components/workflow/TranscriptArea";
src/components/MultimodalTranscriptArea.tsx:6:interface MultimodalTranscriptAreaProps {
src/components/MultimodalTranscriptArea.tsx:15:export const MultimodalTranscriptArea: React.FC<MultimodalTranscriptAreaProps> = ({
src/components/workflow/TranscriptArea.tsx:2: * TranscriptArea Component
src/components/workflow/TranscriptArea.tsx:49:export interface TranscriptAreaProps {
src/components/workflow/TranscriptArea.tsx:89:export const TranscriptArea: React.FC<TranscriptAreaProps> = React.memo(({
src/components/workflow/TranscriptArea.tsx:415:TranscriptArea.displayName = 'TranscriptArea';
src/components/workflow/TranscriptArea.tsx:417:export default TranscriptArea;
src/components/workflow/tabs/SOAPTab.tsx:17:import TranscriptArea from '../TranscriptArea';
src/components/workflow/tabs/SOAPTab.tsx:249:              <TranscriptArea
```

### 4.2 Deidentification audit logger undefined
```
src/services/SOAPGenerationService.ts:26:  static async auditDataAccess(operation: string): Promise<void> {
src/services/SOAPGenerationService.ts:77: * Generates structured clinical documentation with compliance audit trail
src/services/SOAPGenerationService.ts:103:      // Enterprise security audit
src/services/SOAPGenerationService.ts:104:      await MockSecurityService.auditDataAccess('soap_generation');
src/services/virtualTransferService.ts:15: * - Complete audit trail
src/services/virtualTransferService.ts:23:let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;
src/services/virtualTransferService.ts:27:    const module = await import('../core/audit/FirestoreAuditLogger');
src/services/medicalAlertsService.ts:19:let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;
src/services/medicalAlertsService.ts:23:    const module = await import('../core/audit/FirestoreAuditLogger');
src/services/dataErasureService.ts:6: * while maintaining legal retention requirements and audit trails.
```

### 4.3 Prompt professional context undefined
```
src/core/ai/PromptFactory-Canada.ts:96:  console.log('🔍 [PROMPT] Building professional context from profile:', {
src/core/ai/PromptFactory-Canada.ts:141:    console.log('⚠️ [PROMPT] No professional context data available');
```

## 5) Logging of PHI risk (console)
```
src/analytics/events.ts:5:    console.log(`[Analytics] ${action} en ${path}`, data);
src/analytics/events.ts:10:    console.warn('[Analytics] Error logging action:', error);
src/analytics/events.ts:17:    startSession: () => console.log('[Analytics] Session started'),
src/analytics/events.ts:18:    endSession: () => console.log('[Analytics] Session ended'),
src/analytics/events.ts:19:    trackEvent: (event: string, data?: unknown) => console.log(`[Analytics] Event: ${event}`, data)
src/analytics/events.ts:25:    console.log(`[Analytics] Route view: ${route}`, data);
src/analytics/events.ts:28:    console.warn('[Analytics] Error logging route view:', error);
src/lib/firebase.ts:38:    console.warn("⚠️ Error conectando emulators (normal si ya conectados):", error.message);
src/lib/analytics.ts:18:  console.log('Analytics event:', eventName, properties);
src/run-evals.ts:3:console.log('🚀 AiduxCare - Sistema de Evaluación\n');
src/run-evals.ts:7:    console.log('\n✅ Evaluación completada');
src/run-evals.ts:11:    console.error('❌ Error en evaluación:', error);
src/orchestration/validation/response-validator.ts:104:    console.log('[ValidationAudit]', JSON.stringify(logEntry));
src/_deprecated/features_onboarding/SimpleOnboardingPage.tsx:54:    console.log('Datos del formulario:', formData);
src/services/tokenPackageService.ts:79:      console.error('[TokenPackageService] Error purchasing package:', error);
src/services/tokenPackageService.ts:108:      console.error('[TokenPackageService] Error getting purchase history:', error);
src/services/tokenPackageService.ts:137:      console.error('[TokenPackageService] Error getting rollover tokens:', error);
src/services/tokenPackageService.ts:164:      console.error('[TokenPackageService] Error expiring old purchases:', error);
src/services/tokenPackageService.ts:191:      console.error('[TokenPackageService] Error getting package recommendation:', error);
src/services/tokenTrackingService.ts:133:      console.error('[TokenTrackingService] Error getting token usage:', error);
src/services/tokenTrackingService.ts:146:      console.error('[TokenTrackingService] Error checking token availability:', error);
src/services/tokenTrackingService.ts:186:      console.error('[TokenTrackingService] Error allocating tokens:', error);
src/services/tokenTrackingService.ts:242:      console.error('[TokenTrackingService] Error recording token usage:', error);
src/services/tokenTrackingService.ts:270:      console.error('[TokenTrackingService] Error resetting monthly cycle:', error);
src/services/tokenTrackingService.ts:322:      console.error('[TokenTrackingService] Error purchasing token package:', error);
src/services/tokenTrackingService.ts:365:      console.error('[TokenTrackingService] Error getting purchased tokens balance:', error);
src/services/tokenTrackingService.ts:400:      console.error('[TokenTrackingService] Error finding purchase to use:', error);
src/services/tokenTrackingService.ts:429:      console.error('[TokenTrackingService] Error consuming purchased tokens:', error);
src/services/tokenTrackingService.ts:454:      console.error('[TokenTrackingService] Error expiring old purchases:', error);
src/hooks/useProfessionalProfile.ts:104:        console.error('Error loading professional profile:', error);
src/hooks/useProfessionalProfile.ts:161:      console.error('Error refreshing profile:', error);
src/services/dataErasureService.ts:101:    console.error('[DataErasure] Authorization check failed:', error);
src/services/dataErasureService.ts:126:    console.error('[DataErasure] Legal hold check failed:', error);
src/services/dataErasureService.ts:152:    console.error('[DataErasure] Retention check failed:', error);
src/services/dataErasureService.ts:246:    console.error(`[DataErasure] Error deleting from ${collectionName}:`, error);
src/services/dataErasureService.ts:266:      console.error(`[DataErasure] Failed to delete from ${collectionName}:`, error);
src/services/dataErasureService.ts:280:    console.error('[DataErasure] Failed to delete patient record:', error);
src/services/dataErasureService.ts:306:    console.error('[DataErasure] Failed to delete audit logs:', error);
src/services/dataErasureService.ts:330:        console.error(`[DataErasure] Failed to delete file ${itemRef.fullPath}:`, error);
src/services/dataErasureService.ts:342:          console.error(`[DataErasure] Failed to delete file ${itemRef.fullPath}:`, error);
src/services/dataErasureService.ts:349:    console.error('[DataErasure] Failed to delete media files:', error);
src/services/dataErasureService.ts:426:    console.error('[DataErasure] Failed to store deletion certificate:', error);
src/services/dataErasureService.ts:564:    console.error('[DataErasure] Failed to retrieve deletion certificate:', error);
src/services/dataErasureService.ts:582:    console.error('[DataErasure] Failed to check deletion status:', error);
src/services/treatmentPlanService.ts:91:      console.log(`✅ Manual initial treatment plan created: ${planId}`);
src/services/treatmentPlanService.ts:94:      console.error('Error creating manual initial plan:', error);
src/services/treatmentPlanService.ts:199:      console.log(`✅ Treatment plan saved: ${planId}`);
src/services/treatmentPlanService.ts:202:      console.error('Error saving treatment plan:', error);
src/services/treatmentPlanService.ts:229:      console.error('Error fetching treatment plan:', error);
src/services/treatmentPlanService.ts:273:      console.error('Error generating treatment reminder:', error);
```

## 6) Snapshot quarantine check
```
⚠️  WARNING:    26880 snapshot files still tracked
canonical_snapshots/2025-11-16T18-48-16-847Z/src/components/AiDuxVoiceButton.tsx
canonical_snapshots/2025-11-16T18-48-16-847Z/src/components/ClinicalAnalysisResults.tsx
canonical_snapshots/2025-11-16T18-48-16-847Z/src/components/ClinicalInfoPanel.tsx
canonical_snapshots/2025-11-16T18-48-16-847Z/src/components/wizard/LocationDataStep.tsx
canonical_snapshots/2025-11-16T18-48-16-847Z/src/components/wizard/PersonalDataStep.tsx
