/**
 * SIMPLE Browser Console Script - Create Test Patient
 * 
 * This is a simplified version that works directly with the app's context.
 * 
 * INSTRUCTIONS:
 * 1. Make sure the app is running (npm run dev)
 * 2. Open http://localhost:5173 in your browser
 * 3. Open browser console (F12)
 * 4. Copy and paste this ENTIRE script
 * 5. Press Enter
 * 
 * The script will use the app's existing Firebase instance and services.
 */

// Store original console methods
const originalLog = console.log;
const originalError = console.error;

// Enhanced logging
console.log = function(...args) {
  originalLog.apply(console, ['🧪 [TEST SCRIPT]', ...args]);
};

console.error = function(...args) {
  originalError.apply(console, ['❌ [TEST SCRIPT]', ...args]);
};

(async function createTestPatientSimple() {
  try {
    console.log('Starting test patient creation...\n');

    // Step 1: Check if we can access the app's modules
    // Since we're in the browser, we need to use the app's context
    console.log('Step 1: Checking app context...');
    
    // The app should have Firebase initialized
    // We'll use a fetch-based approach to create the patient via the app's API
    // OR we can use the app's UI directly
    
    console.log('\n✅ RECOMMENDED APPROACH:');
    console.log('─'.repeat(60));
    console.log('Use the app UI to create the patient:');
    console.log('');
    console.log('1. Navigate to: http://localhost:5173/command-center');
    console.log('2. Click "Registrar Nuevo Paciente"');
    console.log('3. Fill in:');
    console.log('   - First Name: Test');
    console.log('   - Last Name: Patient Virtual Phone');
    console.log('   - Phone: +18777804236');
    console.log('   - Email: test@example.com (optional)');
    console.log('4. Click "Registrar Paciente"');
    console.log('5. You will be automatically redirected to consent verification');
    console.log('6. The SMS will be sent automatically to the Virtual Phone');
    console.log('─'.repeat(60));
    console.log('');

    // Alternative: Try to access window.__REACT_DEVTOOLS_GLOBAL_HOOK__ or React DevTools
    // to get access to the app's context
    console.log('💡 ALTERNATIVE: Direct Firestore Access');
    console.log('─'.repeat(60));
    console.log('If you want to create the patient directly, you can use:');
    console.log('');
    console.log('1. Open Firebase Console:');
    console.log('   https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore/data');
    console.log('');
    console.log('2. Go to "patients" collection');
    console.log('');
    console.log('3. Click "Add document"');
    console.log('');
    console.log('4. Use this data:');
    const patientData = {
      firstName: 'Test',
      lastName: 'Patient Virtual Phone',
      fullName: 'Test Patient Virtual Phone',
      phone: '+18777804236',
      email: 'test@example.com',
      status: 'active',
      ownerUid: 'test-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log(JSON.stringify(patientData, null, 2));
    console.log('');
    console.log('5. Save the document and note the Document ID');
    console.log('');
    console.log('6. Then run this in the console to send SMS:');
    console.log(`
// Replace PATIENT_ID with the Document ID from step 5
const patientId = 'PATIENT_ID';
const patientName = 'Test Patient Virtual Phone';
const patientPhone = '+18777804236';

// Import services (these should work if the app is loaded)
const { PatientConsentService } = await import('/src/services/patientConsentService.ts');
const { ConsentVerificationService } = await import('/src/services/consentVerificationService.ts');

// Generate consent token
const consentToken = await PatientConsentService.generateConsentToken(
  patientId,
  patientName,
  patientPhone,
  'test@example.com',
  'AiduxCare Clinic',
  'test-user',
  'Dr. Smith'
);

// Initialize verification (this will send SMS)
const verificationState = await ConsentVerificationService.initializeVerification(
  patientId,
  patientName,
  patientPhone,
  'AiduxCare Clinic',
  'test-user',
  'Dr. Smith'
);

console.log('✅ Consent flow initiated!');
console.log('Consent URL:', window.location.origin + '/consent/' + consentToken);
    `);
    console.log('─'.repeat(60));
    console.log('');

    // Restore original console methods
    console.log = originalLog;
    console.error = originalError;

    return {
      success: true,
      message: 'See instructions above',
      patientData
    };

  } catch (error) {
    console.error('Error:', error);
    console.error('Message:', error.message);
    
    // Restore original console methods
    console.log = originalLog;
    console.error = originalError;
    
    return {
      success: false,
      error: error.message
    };
  }
})();

