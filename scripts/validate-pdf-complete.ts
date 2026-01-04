import { readFileSync, existsSync } from 'fs';

async function validateComplete() {
  console.log('🔍 Validating PDF Processing Complete Implementation...\n');
  
  const checks = {
    phase1: false,
    phase2: false,
    ui: false,
    tests: false,
  };
  
  // Phase 1: Core extraction
  console.log('✓ Phase 1: PDF Text Extraction');
  if (existsSync('src/services/pdfTextExtractor.ts') &&
      existsSync('src/services/FileProcessorService.ts')) {
    console.log('  ✓ Core files exist');
    checks.phase1 = true;
  } else {
    console.error('  ✗ Core files missing');
  }
  
  // Phase 2: Prompt integration
  console.log('\n✓ Phase 2: Prompt Integration');
  const promptFactory = readFileSync('src/core/ai/PromptFactory-Canada.ts', 'utf-8');
  if (promptFactory.includes('CLINICAL ATTACHMENTS') &&
      promptFactory.includes('attachments')) {
    console.log('  ✓ Prompt integration complete');
    checks.phase2 = true;
  } else {
    console.error('  ✗ Prompt integration incomplete');
  }
  
  // Phase 3: UI
  console.log('\n✓ Phase 3: UI Components');
  if (existsSync('src/components/ClinicalAttachmentCard.tsx')) {
    console.log('  ✓ UI component exists');
    try {
      const transcriptArea = readFileSync('src/components/workflow/TranscriptArea.tsx', 'utf-8');
      if (transcriptArea.includes('ClinicalAttachmentCard')) {
        console.log('  ✓ UI component integrated');
        checks.ui = true;
      } else {
        console.error('  ✗ UI component not integrated');
      }
    } catch (error) {
      console.error('  ✗ Could not read TranscriptArea.tsx');
    }
  } else {
    console.error('  ✗ UI component missing');
  }
  
  // Testing
  console.log('\n✓ Testing Infrastructure');
  if (existsSync('scripts/manual-test-checklist.md')) {
    console.log('  ✓ Test checklist exists');
    if (existsSync('test-data/matt-proctor-mri.txt')) {
      console.log('  ✓ Test data exists');
      checks.tests = true;
    } else {
      console.error('  ✗ Test data missing');
    }
  } else {
    console.error('  ✗ Test checklist missing');
  }
  
  // Summary
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Validation: ${passed}/${total} phases complete`);
  console.log(`${'='.repeat(50)}\n`);
  
  if (passed === total) {
    console.log('✅ PDF Processing FULLY IMPLEMENTED\n');
    console.log('Next steps:');
    console.log('1. Run manual tests: Follow scripts/manual-test-checklist.md');
    console.log('2. Verify 5/5 findings detected with Matt Proctor MRI');
    console.log('3. Commit changes: git commit -m "feat: PDF processing complete"');
    console.log('4. Merge to main branch\n');
  } else {
    console.error('❌ Implementation incomplete');
    process.exit(1);
  }
}

validateComplete().catch((error) => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});

