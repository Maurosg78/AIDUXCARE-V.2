import { mkdir, copyFile, stat, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const filesToSnapshot = [
  // Authentication & Onboarding
  'src/pages/LoginPage.tsx',
  'src/pages/OnboardingPage.tsx',
  'src/components/wizard/PersonalDataStep.tsx',
  'src/components/wizard/ProfessionalDataStep.tsx',
  'src/components/wizard/LocationDataStep.tsx',
  'src/styles/wizard.module.css',
  
  // Patient Consent Workflow (PHIPA s.18) — CANONICAL
  'src/pages/PatientConsentPortalPage.tsx',
  'src/components/consent/LegalConsentDocument.tsx',
  'src/components/consent/ConsentActionButtons.tsx',
  'src/content/legalConsentContent.ts',
  'src/services/patientConsentService.ts',
  'src/services/smsService.ts',
  'src/pages/ConsentVerificationPage.tsx',
  
  // Clinical Workflow & Audio Pipeline
  'src/pages/ProfessionalWorkflowPage.tsx',
  'src/components/ClinicalAnalysisResults.tsx',
  'src/components/AiDuxVoiceButton.tsx',
  'src/components/ClinicalInfoPanel.tsx',
  'src/components/WorkflowSidebar.tsx', // ✅ NEW: Apple-style sidebar navigation
  'src/components/SessionComparison.tsx', // ✅ Session comparison component
  'src/services/sessionComparisonService.ts', // ✅ Session comparison service
  'src/hooks/useNiagaraProcessor.ts',
  'src/hooks/useAiDuxVoice.ts',
  'src/services/vertex-ai-service-firebase.ts',
  'src/services/AiDuxVoiceService.ts',
  'src/services/AiDuxVoiceTypes.ts',
  'src/core/ai/PromptFactory-Canada.ts',
  'src/utils/cleanVertexResponse.ts',
  'src/services/OpenAIWhisperService.ts',
  'src/hooks/useTranscript.ts',
  'src/services/sessionService.ts',
  'src/services/clinicalAttachmentService.ts',
  
  // ✅ Sprint 2A: Token Tracking & Billing
  'src/services/tokenTrackingService.ts',
  'src/services/spendCapService.ts',
  'src/services/tokenPackageService.ts',
  'src/components/TokenUsageDisplay.tsx',
  'src/components/SpendCapManager.tsx',
  'src/components/TokenPackageStore.tsx',
  
  // ✅ Sprint 2A: Session Types
  'src/services/sessionTypeService.ts',
  'src/components/SessionTypeSelector.tsx',
  
  // ✅ Sprint 2B: WSIB Forms
  'src/components/WSIBFormGenerator.tsx',
  'src/services/wsibTemplateService.ts',
];

async function sourceExists(relPath) {
  const fullPath = path.join(projectRoot, relPath);
  try {
    const fileStat = await stat(fullPath);
    return fileStat.isFile();
  } catch (error) {
    return false;
  }
}

async function createSnapshot() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const targetRoot = path.join(projectRoot, "canonical_snapshots", timestamp);

  const existingFiles = [];
  const missingFiles = [];

  for (const relPath of filesToSnapshot) {
    if (await sourceExists(relPath)) {
      existingFiles.push(relPath);
      const source = path.join(projectRoot, relPath);
      const destination = path.join(targetRoot, relPath);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(source, destination);
    } else {
      missingFiles.push(relPath);
    }
  }

  if (missingFiles.length > 0) {
    console.warn("⚠️  Warning: Some files not found (skipped):");
    missingFiles.forEach((file) => console.warn(`   - ${file}`));
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    files: existingFiles,
    missingFiles: missingFiles.length > 0 ? missingFiles : undefined
  };

  await writeFile(
    path.join(targetRoot, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log(`✅ Canonical snapshot created at ${path.relative(projectRoot, targetRoot)}`);
  console.log(`📦 Files included (${existingFiles.length}):`);
  existingFiles.forEach((file) => console.log(`   ✅ ${file}`));
}

createSnapshot().catch((error) => {
  console.error("❌ Failed to create canonical snapshot:", error.message);
  process.exit(1);
});

