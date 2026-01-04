import { readFileSync, existsSync } from 'fs';

/**
 * Test that PDF processing is properly integrated into prompts
 */
async function testPromptIntegration() {
  console.log('🔍 Testing PDF → Prompt Integration...\n');
  
  let hasErrors = false;
  
  // Check 1: PromptFactory accepts attachments
  console.log('✓ Checking PromptFactory interface...');
  const promptFactory = readFileSync('src/core/ai/PromptFactory-Canada.ts', 'utf-8');
  
  if (!promptFactory.includes('attachments')) {
    console.error('  ✗ PromptFactory missing attachments parameter');
    hasErrors = true;
  } else {
    console.log('  ✓ PromptFactory accepts attachments');
  }
  
  // Check 2: Attachments section in prompt
  if (!promptFactory.includes('CLINICAL ATTACHMENTS') && !promptFactory.includes('Clinical Attachments')) {
    console.error('  ✗ PromptFactory missing attachments section in prompt');
    hasErrors = true;
  } else {
    console.log('  ✓ PromptFactory includes attachment section');
  }
  
  // Check 3: Critical analysis instructions
  const requiredInstructions = [
    'red flag',
    'diagnostic finding',
    'contraindication',
  ];
  
  for (const instruction of requiredInstructions) {
    if (!promptFactory.toLowerCase().includes(instruction.toLowerCase())) {
      console.error(`  ✗ Missing critical instruction: "${instruction}"`);
      hasErrors = true;
    }
  }
  
  if (!hasErrors) {
    console.log('  ✓ Critical analysis instructions present');
  }
  
  // Check 4: useNiagaraProcessor passes attachments
  console.log('\n✓ Checking useNiagaraProcessor...');
  const processor = readFileSync('src/hooks/useNiagaraProcessor.ts', 'utf-8');
  
  if (!processor.includes('attachments')) {
    console.error('  ✗ useNiagaraProcessor not passing attachments to prompt');
    hasErrors = true;
  } else {
    console.log('  ✓ useNiagaraProcessor passes attachments');
  }
  
  // Check 5: Error handling for missing text
  if (!promptFactory.includes('Could not extract text') && !promptFactory.includes('could not extract')) {
    console.error('  ✗ Missing error handling for extraction failures');
    hasErrors = true;
  } else {
    console.log('  ✓ Error handling present');
  }
  
  // Check 6: vertex-ai-service-firebase accepts attachments
  console.log('\n✓ Checking vertex-ai-service-firebase...');
  const vertexService = readFileSync('src/services/vertex-ai-service-firebase.ts', 'utf-8');
  
  if (!vertexService.includes('attachments')) {
    console.error('  ✗ vertex-ai-service-firebase not accepting attachments');
    hasErrors = true;
  } else {
    console.log('  ✓ vertex-ai-service-firebase accepts attachments');
  }
  
  // Check 7: PromptFactory-v3 passes attachments
  console.log('\n✓ Checking PromptFactory-v3...');
  const promptFactoryV3 = readFileSync('src/core/ai/PromptFactory-v3.ts', 'utf-8');
  
  if (!promptFactoryV3.includes('attachments')) {
    console.error('  ✗ PromptFactory-v3 not passing attachments');
    hasErrors = true;
  } else {
    console.log('  ✓ PromptFactory-v3 passes attachments');
  }
  
  // Final result
  console.log('');
  if (hasErrors) {
    console.error('❌ Verification failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('✅ All prompt integration checks passed!\n');
  }
}

testPromptIntegration().catch((error) => {
  console.error('❌ Verification script error:', error);
  process.exit(1);
});

