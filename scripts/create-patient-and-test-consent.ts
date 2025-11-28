/**
 * Create Patient and Test Consent Flow
 * 
 * Creates a test patient in Firestore and initiates the complete consent flow:
 * 1. Create patient in Firestore
 * 2. Initialize consent verification
 * 3. Send SMS to Virtual Phone
 * 4. Generate consent link
 * 
 * Usage: npm run test:consent-full
 * Or: tsx scripts/create-patient-and-test-consent.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

// Import Firebase config from the app
import { db } from '../src/lib/firebase';

const TWILIO_ACCOUNT_SID = process.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.VITE_TWILIO_PHONE_NUMBER;
const VIRTUAL_PHONE = '+18777804236';
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

// Generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createPatientAndTestConsent() {
  console.log('🧪 Creating Patient and Testing Consent Flow...\n');

  // Validate configuration
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('❌ Error: Twilio credentials not configured');
    process.exit(1);
  }

  // Import Firebase config
  const firebaseModule = await import('../src/lib/firebase.ts');
  const db = firebaseModule.db;
  
  if (!db) {
    console.error('❌ Error: Firebase not initialized');
    console.error('   Make sure Firebase is properly configured in src/lib/firebase.ts');
    process.exit(1);
  }

  // Step 1: Create test patient
  console.log('📋 Step 1: Creating test patient in Firestore...\n');

  const testPatientId = `test-patient-${Date.now()}`;
  const testPatientName = 'Test Patient Virtual Phone';
  const testPatientPhone = VIRTUAL_PHONE;

  try {
    const patientData = {
      firstName: 'Test',
      lastName: 'Patient Virtual Phone',
      fullName: testPatientName,
      phone: testPatientPhone,
      email: 'test@example.com',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ownerUid: 'test-user',
    };

    // Try to create in 'patients' collection
    const patientRef = await addDoc(collection(db, 'patients'), {
      ...patientData,
      id: testPatientId,
    });

    const actualPatientId = patientRef.id;
    console.log('✅ Patient created successfully!');
    console.log(`   Patient ID: ${actualPatientId}`);
    console.log(`   Patient Name: ${testPatientName}`);
    console.log(`   Patient Phone: ${testPatientPhone}\n`);

    // Step 2: Generate consent token
    console.log('🔐 Step 2: Generating consent token...\n');

    const consentToken = generateUUID();
    const consentUrl = `${BASE_URL}/consent/${consentToken}`;

    console.log(`   Consent Token: ${consentToken}`);
    console.log(`   Consent URL: ${consentUrl}\n`);

    // Step 3: Save consent token to Firestore
    console.log('💾 Step 3: Saving consent token to Firestore...\n');

    const tokenData = {
      token: consentToken,
      patientId: actualPatientId,
      patientName: testPatientName,
      patientPhone: testPatientPhone,
      clinicName: 'AiduxCare Clinic',
      physiotherapistId: 'test-user',
      physiotherapistName: 'Dr. Smith',
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      used: false,
    };

    await addDoc(collection(db, 'patient_consent_tokens'), tokenData);
    console.log('✅ Consent token saved to Firestore\n');

    // Step 4: Initialize consent verification
    console.log('📝 Step 4: Initializing consent verification...\n');

    const verificationData = {
      patientId: actualPatientId,
      patientName: testPatientName,
      patientPhone: testPatientPhone,
      smsStatus: 'sending',
      consentMethod: null,
      consentTimestamp: null,
      fisioIpAddress: 'script-generated',
      auditTrail: [
        {
          event: 'sms_sent',
          timestamp: serverTimestamp(),
          ipAddress: 'script-generated',
          userAgent: 'test-script',
          metadata: { token: consentToken, phone: testPatientPhone },
        },
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'consent_verifications'), verificationData);
    console.log('✅ Consent verification initialized\n');

    // Step 5: Send SMS via Twilio
    console.log('📱 Step 5: Sending SMS to Virtual Phone...\n');

    const message = `Hola ${testPatientName}, Dr. Smith necesita su consentimiento para datos de salud según ley canadiense.

Autorizar: ${consentUrl}

AiduxCare Clinic
STOP para cancelar`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: testPatientPhone,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Twilio API Error:');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Code: ${errorData.code}`);
      console.error(`   Message: ${errorData.message}`);
      process.exit(1);
    }

    const smsResult = await response.json();

    // Step 6: Save SMS to audit trail
    console.log('💾 Step 6: Saving SMS to audit trail...\n');

    await addDoc(collection(db, 'pending_sms'), {
      phone: testPatientPhone,
      message,
      patientName: testPatientName,
      clinicName: 'AiduxCare Clinic',
      consentToken,
      consentUrl,
      status: 'sent',
      twilioSid: smsResult.sid,
      twilioStatus: smsResult.status,
      createdAt: serverTimestamp(),
      type: 'consent_request',
    });

    // Update consent verification status
    const verificationRef = collection(db, 'consent_verifications');
    const q = query(verificationRef, where('patientId', '==', actualPatientId));
    const verificationSnap = await getDocs(q);
    
    if (!verificationSnap.empty) {
      const verificationDoc = verificationSnap.docs[0];
      await updateDoc(doc(db, 'consent_verifications', verificationDoc.id), {
        smsStatus: 'sent',
        updatedAt: serverTimestamp(),
      });
    }

    console.log('✅ SMS sent and saved to audit trail!');
    console.log(`   Message SID: ${smsResult.sid}`);
    console.log(`   Status: ${smsResult.status}\n`);

    // Final summary
    console.log('🎉 FLUJO COMPLETO INICIADO EXITOSAMENTE!\n');
    console.log('📋 RESUMEN:');
    console.log('─'.repeat(60));
    console.log(`✅ Patient ID: ${actualPatientId}`);
    console.log(`✅ Patient Name: ${testPatientName}`);
    console.log(`✅ Consent Token: ${consentToken}`);
    console.log(`✅ SMS SID: ${smsResult.sid}`);
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
    console.log(`   ${BASE_URL}/consent-verification/${actualPatientId}`);
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

    console.log('✅ Test patient created and consent flow initiated!');
    console.log(`   Patient ID: ${actualPatientId}`);
    console.log('   Check Virtual Phone for the SMS with consent link.\n');

  } catch (error: any) {
    console.error('❌ Error:', error);
    console.error(`   Message: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run
createPatientAndTestConsent().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

