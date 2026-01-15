import { readFileSync, existsSync } from 'fs';

async function validateSOAPIntegration() {
  console.log('🔍 Validating SOAP MRI Integration...\n');
  
  const checks = {
    soapBuilderExists: false,
    includesKeyFindings: false,
    serializesTreatmentPlan: false,
    hasLogging: false,
  };
  
  // Find SOAP builder file
  const soapServicePath = 'src/services/vertex-ai-soap-service.ts';
  
  try {
    const content = readFileSync(soapServicePath, 'utf-8');
    checks.soapBuilderExists = true;
    
    // Check for key findings integration
    if (content.includes('hallazgos_clinicos') || content.includes('key_findings') || content.includes('keyFindings')) {
      checks.includesKeyFindings = true;
    }
    
    // Check for treatment plan serialization
    if (content.includes('formatTreatmentPlan') || (content.includes('serialize') && content.includes('treatment'))) {
      checks.serializesTreatmentPlan = true;
    }
    
    // Check for logging
    if (content.includes('[SOAP Builder]')) {
      checks.hasLogging = true;
    }
    
    console.log('✓ SOAP builder exists:', soapServicePath);
    console.log('✓ Key findings integration:', checks.includesKeyFindings ? '✅' : '❌');
    console.log('✓ Treatment plan serialization:', checks.serializesTreatmentPlan ? '✅' : '❌');
    console.log('✓ Debug logging:', checks.hasLogging ? '✅' : '❌');
    
    // Check prompt factory for key findings instruction
    console.log('\n✓ Checking SOAP Prompt Factory...');
    const promptFactoryPath = 'src/core/soap/SOAPPromptFactory.ts';
    if (existsSync(promptFactoryPath)) {
      const promptContent = readFileSync(promptFactoryPath, 'utf-8');
      if (promptContent.includes('MUST INCLUDE KEY FINDINGS') || promptContent.includes('KEY FINDINGS from clinical analysis')) {
        console.log('  ✓ Prompt instructs AI to include key findings in Objective');
        checks.includesKeyFindings = true; // Override if prompt has instruction
      } else {
        console.log('  ⚠️  Prompt may not explicitly instruct inclusion of key findings');
      }
    }
    
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Validation: ${passed}/${total} checks passed`);
    console.log(`${'='.repeat(50)}\n`);
    
    if (passed === total) {
      console.log('✅ SOAP MRI Integration COMPLETE\n');
      console.log('Next steps:');
      console.log('1. Upload MRI PDF');
      console.log('2. Generate SOAP');
      console.log('3. Verify MRI findings in Objective');
      console.log('4. Verify Plan is readable\n');
    } else {
      console.error('❌ Integration incomplete');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

validateSOAPIntegration().catch(console.error);





