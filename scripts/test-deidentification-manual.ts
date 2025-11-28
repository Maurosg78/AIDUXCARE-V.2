/**
 * Manual Functional Tests for DataDeidentificationService
 * 
 * Run with: npx tsx scripts/test-deidentification-manual.ts
 */

import { deidentify, reidentify, validateDeidentification } from '../src/services/dataDeidentificationService';

// Test scenarios
const testScenarios = [
  {
    name: 'Patient Name Removal',
    input: 'Patient John Smith presents with lower back pain.',
    expectedDeidentified: '[NAME_',
    expectedNotInDeidentified: 'John Smith',
    expectedInReidentified: 'John Smith',
  },
  {
    name: 'Phone Number Removal',
    input: 'Contact patient at 416-555-1234 or (416) 555-5678.',
    expectedDeidentified: '[PHONE_',
    expectedNotInDeidentified: '416-555-1234',
    expectedInReidentified: '416-555-1234',
  },
  {
    name: 'Postal Code Removal',
    input: 'Patient lives at postal code M5H 2N2.',
    expectedDeidentified: '[POSTALCODE_',
    expectedNotInDeidentified: 'M5H 2N2',
    expectedInReidentified: 'M5H 2N2',
  },
  {
    name: 'Email Address Removal',
    input: 'Contact patient at john.doe@example.com.',
    expectedDeidentified: '[EMAIL_',
    expectedNotInDeidentified: 'john.doe@example.com',
    expectedInReidentified: 'john.doe@example.com',
  },
  {
    name: 'Health Card Number Removal',
    input: 'Health card number: 1234-567-890-AB',
    expectedDeidentified: '[HEALTHCARD_',
    expectedNotInDeidentified: '1234-567-890-AB',
    expectedInReidentified: '1234-567-890-AB',
  },
  {
    name: 'Multiple Identifiers',
    input: 'Patient Jane Doe, phone 416-555-1234, postal code M5H 2N2, email jane@example.com',
    expectedDeidentified: '[NAME_',
    expectedNotInDeidentified: 'Jane Doe',
    expectedInReidentified: 'Jane Doe',
  },
  {
    name: 'Clinical Context Preservation',
    input: 'Patient John Smith presents with lower back pain. ROM limited in flexion. No red flags.',
    expectedDeidentified: 'lower back pain',
    expectedNotInDeidentified: 'John Smith',
    expectedInReidentified: 'John Smith',
  },
  {
    name: 'Text Without Identifiers',
    input: 'Patient presents with lower back pain. No other concerns.',
    expectedDeidentified: '',
    expectedNotInDeidentified: '',
    expectedInReidentified: '',
  },
];

console.log('==========================================');
console.log('W1-005: Functional Testing - Deidentification');
console.log('==========================================\n');

let testsPassed = 0;
let testsFailed = 0;

for (const scenario of testScenarios) {
  console.log(`\n=== Test: ${scenario.name} ===`);
  console.log(`Input: ${scenario.input}`);
  
  try {
    // Test deidentification
    const deidentified = deidentify(scenario.input);
    console.log(`Deidentified: ${deidentified.deidentifiedText}`);
    console.log(`Removed count: ${deidentified.removedCount}`);
    console.log(`Identifiers map: ${JSON.stringify(deidentified.identifiersMap)}`);
    
    // Test reidentification
    const reidentified = reidentify(deidentified.deidentifiedText, deidentified.identifiersMap);
    console.log(`Reidentified: ${reidentified}`);
    
    // Validate results
    let passed = true;
    let failures: string[] = [];
    
    if (scenario.expectedDeidentified && !deidentified.deidentifiedText.includes(scenario.expectedDeidentified)) {
      passed = false;
      failures.push(`Expected deidentified text to contain "${scenario.expectedDeidentified}"`);
    }
    
    if (scenario.expectedNotInDeidentified && deidentified.deidentifiedText.includes(scenario.expectedNotInDeidentified)) {
      passed = false;
      failures.push(`Expected deidentified text NOT to contain "${scenario.expectedNotInDeidentified}"`);
    }
    
    if (scenario.expectedInReidentified && !reidentified.includes(scenario.expectedInReidentified)) {
      passed = false;
      failures.push(`Expected reidentified text to contain "${scenario.expectedInReidentified}"`);
    }
    
    // Test validation
    const remaining = validateDeidentification(deidentified.deidentifiedText);
    if (remaining.length > 0 && scenario.expectedDeidentified) {
      console.log(`⚠️  Warning: ${remaining.length} identifiers still detected in deidentified text`);
      console.log(`   Remaining: ${remaining.join(', ')}`);
    }
    
    if (passed) {
      console.log('✅ PASS');
      testsPassed++;
    } else {
      console.log('❌ FAIL');
      failures.forEach(f => console.log(`   - ${f}`));
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error}`);
    testsFailed++;
  }
}

console.log('\n==========================================');
console.log('Test Summary');
console.log('==========================================');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total: ${testsPassed + testsFailed}`);
console.log('');

if (testsFailed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed');
  process.exit(1);
}


