#!/usr/bin/env node

/**
 * FHIR Module Validation Script
 * 
 * This script validates the FHIR module by:
 * 1. Running all FHIR-related tests
 * 2. Checking TypeScript compilation
 * 3. Running linting on FHIR files
 * 4. Validating module structure
 * 5. Running profile validation tests
 * 
 * Usage: npm run validate:fhir
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(60));
}

function logStep(step, status = 'info') {
  const statusColor = status === 'success' ? 'green' : status === 'error' ? 'red' : 'yellow';
  const statusSymbol = status === 'success' ? '✅' : status === 'error' ? '❌' : '⏳';
  log(`${statusSymbol} ${step}`, statusColor);
}

function runCommand(command, description) {
  try {
    logStep(description, 'info');
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    logStep(description, 'success');
    return { success: true, output: result };
  } catch (error) {
    logStep(description, 'error');
    log(`Error: ${error.message}`, 'red');
    if (error.stdout) {
      log('STDOUT:', 'yellow');
      console.log(error.stdout);
    }
    if (error.stderr) {
      log('STDERR:', 'yellow');
      console.log(error.stderr);
    }
    return { success: false, error };
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

function validateModuleStructure() {
  logStep('Validating FHIR module structure', 'info');
  
  const requiredFiles = [
    'src/core/fhir/index.ts',
    'src/core/fhir/types/fhirPatient.ts',
    'src/core/fhir/types/fhirEncounter.ts',
    'src/core/fhir/types/fhirObservation.ts',
    'src/core/fhir/types/fhirBundle.ts',
    'src/core/fhir/types/validation.ts',
    'src/core/fhir/types/index.ts',
    'src/core/fhir/adapters/internalToFhir.ts',
    'src/core/fhir/adapters/fhirToInternal.ts',
    'src/core/fhir/validators/caCoreValidator.ts',
    'src/core/fhir/validators/usCoreValidator.ts',
    'src/core/fhir/utils/bundleUtils.ts',
    'src/core/fhir/utils/jsonUtils.ts',
    'src/core/fhir/tests/types.test.ts',
    'src/core/fhir/tests/adapters.test.ts',
    'src/core/fhir/tests/validators.test.ts',
    'src/core/fhir/tests/utils.test.ts'
  ];

  const missingFiles = [];
  
  for (const file of requiredFiles) {
    if (!checkFileExists(file)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    log('Missing required files:', 'red');
    missingFiles.forEach(file => log(`  - ${file}`, 'red'));
    return false;
  }

  logStep('FHIR module structure validation', 'success');
  return true;
}

function runFhirTests() {
  logStep('Running FHIR module tests', 'info');
  
  const testResult = runCommand(
    'npm run test src/core/fhir',
    'Executing FHIR tests'
  );

  if (!testResult.success) {
    log('FHIR tests failed!', 'red');
    return false;
  }

  logStep('FHIR tests execution', 'success');
  return true;
}

function runTypeScriptCheck() {
  logStep('Running TypeScript compilation check', 'info');
  
  const tsResult = runCommand(
    'npx tsc --noEmit',
    'TypeScript compilation check'
  );

  if (!tsResult.success) {
    log('TypeScript compilation failed!', 'red');
    return false;
  }

  logStep('TypeScript compilation check', 'success');
  return true;
}

function runLinting() {
  logStep('Running ESLint on FHIR files', 'info');
  
  const lintResult = runCommand(
    'npx eslint src/core/fhir/**/*.ts',
    'ESLint validation'
  );

  if (!lintResult.success) {
    log('ESLint validation failed!', 'red');
    return false;
  }

  logStep('ESLint validation', 'success');
  return true;
}

function runProfileValidation() {
  logStep('Running FHIR profile validation tests', 'info');
  
  // Create a simple test FHIR resource for validation
  const testPatient = {
    resourceType: 'Patient',
    id: 'test-patient-123',
    identifier: [{ system: 'http://example.com/patients', value: '123' }],
    name: [{ use: 'official', text: 'Test Patient' }],
    active: true
  };

  try {
    // Import and test the validators
    const { validateCaCorePatient, validateUsCorePatient } = require('../src/core/fhir/validators/caCoreValidator');
    const { validateUsCorePatient: validateUsCorePatient2 } = require('../src/core/fhir/validators/usCoreValidator');
    
    // Test CA Core validation
    const caCoreResult = validateCaCorePatient(testPatient);
    if (!caCoreResult.isValid) {
      log('CA Core validation failed:', 'red');
      caCoreResult.errors.forEach(error => log(`  - ${error}`, 'red'));
      return false;
    }

    // Test US Core validation
    const usCoreResult = validateUsCorePatient2(testPatient);
    if (!usCoreResult.isValid) {
      log('US Core validation failed:', 'red');
      usCoreResult.errors.forEach(error => log(`  - ${error}`, 'red'));
      return false;
    }

    logStep('FHIR profile validation', 'success');
    return true;
  } catch (error) {
    log('Profile validation test failed:', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function generateValidationReport(results) {
  logSection('VALIDATION REPORT');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const failedChecks = totalChecks - passedChecks;
  
  log(`Total Checks: ${totalChecks}`, 'bright');
  log(`Passed: ${passedChecks}`, 'green');
  log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');
  
  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} - ${check}`, color);
  });
  
  if (failedChecks === 0) {
    log('\n🎉 All FHIR module validations passed successfully!', 'green');
    return true;
  } else {
    log('\n⚠️  Some validations failed. Please review the errors above.', 'red');
    return false;
  }
}

async function main() {
  logSection('FHIR MODULE VALIDATION');
  log('Starting comprehensive validation of the FHIR module...', 'blue');
  
  const results = {
    'Module Structure': validateModuleStructure(),
    'TypeScript Compilation': runTypeScriptCheck(),
    'ESLint Validation': runLinting(),
    'FHIR Tests': runFhirTests(),
    'Profile Validation': runProfileValidation()
  };
  
  const overallSuccess = generateValidationReport(results);
  
  // Exit with appropriate code
  process.exit(overallSuccess ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('\n❌ Uncaught Exception:', 'red');
  log(error.message, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('\n❌ Unhandled Rejection:', 'red');
  log(`Promise: ${promise}`, 'red');
  log(`Reason: ${reason}`, 'red');
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log('\n❌ Validation script failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
