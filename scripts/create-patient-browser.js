/**
 * Browser Console Script - Create Test Patient
 * 
 * Copy and paste this entire script into your browser console (F12)
 * while on the AiduxCare application (any page).
 * 
 * This will:
 * 1. Create a test patient in Firestore
 * 2. Generate a consent token
 * 3. Send SMS to Virtual Phone
 * 4. Initialize consent verification
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Navigate to any page of the app (e.g., http://localhost:5173)
 * 3. Paste this entire script and press Enter
 */

(async function createTestPatient() {
  console.log('🧪 Creating Test Patient and Initiating Consent Flow...\n');

  // Check if we're in the right context
  if (typeof window === 'undefined') {
    console.error('❌ This script must be run in the browser console');
    return;
  }

  // Try to access Firebase from window or use dynamic imports
  let db, collection, addDoc, serverTimestamp;
  let PatientConsentService, ConsentVerificationService;

  try {
    // Method 1: Try to use existing Firebase instance from the app
    // The app should have initialized Firebase, so we can try to access it
    const firebaseModule = await import('firebase/firestore');
    collection = firebaseModule.collection;
    addDoc = firebaseModule.addDoc;
    serverTimestamp = firebaseModule.serverTimestamp;
    
    // Try to get db from the app's Firebase instance
    // We'll need to initialize it or access it from the app context
    const { initializeApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    
    // Get config from window or use defaults
    const firebaseConfig = window.__FIREBASE_CONFIG__ || {
      apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env?.VITE_FIREBASE_APP_ID,
    };
    
    try {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
    } catch (e) {
      // App might already be initialized
      db = getFirestore();
    }
    
    // Import services
    const consentModule = await import('/src/services/patientConsentService.ts');
    PatientConsentService = consentModule.PatientConsentService;
    
    const verificationModule = await import('/src/services/consentVerificationService.ts');
    ConsentVerificationService = verificationModule.ConsentVerificationService;
    
  } catch (error) {
    console.error('❌ Error importing modules:', error);
    console.log('\n💡 Alternative: Use the app UI to create the patient:');
    console.log('   1. Go to http://localhost:5173/command-center');
    console.log('   2. Click "Registrar Nuevo Paciente"');
    console.log('   3. Fill in the form with:');
    console.log('      - Name: Test');
    console.log('      - Last Name: Patient Virtual Phone');
    console.log('      - Phone: +18777804236');
    console.log('   4. Submit the form');
    console.log('   5. You will be redirected to consent verification automatically\n');
    return;
  }

  // Test data
  const testPatientName = 'Test Patient Virtual Phone';
  const testPatientPhone = '+18777804236';
  const testPatientEmail = 'test@example.com';
  const clinicName = 'AiduxCare Clinic';
  const physiotherapistId = 'test-user';
  const physiotherapistName = 'Dr. Smith';

  try {
    // Step 1: Create patient
    console.log('📋 Step 1: Creating test patient in Firestore...\n');
    
    const patientData = {
      firstName: 'Test',
      lastName: 'Patient Virtual Phone',
      fullName: testPatientName,
      phone: testPatientPhone,
      email: testPatientEmail,
      status: 'active',
      ownerUid: physiotherapistId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const patientRef = await addDoc(collection(db, 'patients'), patientData);
    const patientId = patientRef.id;
    
    console.log('✅ Patient created successfully!');
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Patient Name: ${testPatientName}`);
    console.log(`   Patient Phone: ${testPatientPhone}\n`);

    // Step 2: Generate consent token
    console.log('🔐 Step 2: Generating consent token...\n');
    
    const consentToken = await PatientConsentService.generateConsentToken(
      patientId,
      testPatientName,
      testPatientPhone,
      testPatientEmail,
      clinicName,
      physiotherapistId,
      physiotherapistName
    );
    
    const consentUrl = `${window.location.origin}/consent/${consentToken}`;
    console.log(`✅ Consent token generated: ${consentToken}`);
    console.log(`   Consent URL: ${consentUrl}\n`);

    // Step 3: Initialize consent verification
    console.log('📝 Step 3: Initializing consent verification...\n');
    
    const verificationState = await ConsentVerificationService.initializeVerification(
      patientId,
      testPatientName,
      testPatientPhone,
      clinicName,
      physiotherapistId,
      physiotherapistName
    );
    
    console.log('✅ Consent verification initialized!');
    console.log(`   SMS Status: ${verificationState.smsStatus}`);
    console.log(`   Consent Token: ${verificationState.consentToken}\n`);

    // Step 4: Summary
    console.log('🎉 FLUJO COMPLETO INICIADO EXITOSAMENTE!\n');
    console.log('📋 RESUMEN:');
    console.log('─'.repeat(60));
    console.log(`✅ Patient ID: ${patientId}`);
    console.log(`✅ Patient Name: ${testPatientName}`);
    console.log(`✅ Consent Token: ${consentToken}`);
    console.log(`✅ SMS Status: ${verificationState.smsStatus}`);
    console.log('─'.repeat(60));
    console.log('');

    console.log('📱 NEXT STEPS:');
    console.log('─'.repeat(60));
    console.log('1. Check Virtual Phone for SMS:');
    console.log('   https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms');
    console.log('');
    console.log('2. Click the consent link in the SMS:');
    console.log(`   ${consentUrl}`);
    console.log('');
    console.log('3. Or navigate directly in your app:');
    console.log(`   ${window.location.origin}/consent-verification/${patientId}`);
    console.log('');
    console.log('4. Complete the consent form');
    console.log('');
    console.log('5. Verify legal traceability in Firestore:');
    console.log('   - Collection: consent_verifications');
    console.log('   - Collection: patient_consents');
    console.log('   - Collection: pending_sms');
    console.log('   - Collection: patient_consent_tokens');
    console.log('─'.repeat(60));
    console.log('');

    // Return patient ID for easy access
    window.testPatientId = patientId;
    window.testConsentToken = consentToken;
    window.testConsentUrl = consentUrl;
    
    console.log('💡 TIP: Patient ID saved to window.testPatientId');
    console.log('   You can access it later: window.testPatientId');
    console.log('');

    return {
      patientId,
      consentToken,
      consentUrl,
      verificationState
    };

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(`   Message: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    throw error;
  }
})();

