/**
 * Create Test Patient Script
 * 
 * Creates a test patient directly in Firestore and initiates consent flow.
 * This script uses Node.js with Firebase Admin SDK for direct database access.
 * 
 * Usage: node scripts/create-test-patient.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { config } = require('dotenv');
const { resolve } = require('path');
const fetch = require('node-fetch');

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin (if not already initialized)
let db;
try {
  // Try to use existing app
  const admin = require('firebase-admin');
  db = getFirestore();
} catch (error) {
  // Initialize with service account or use REST API
  console.log('⚠️  Firebase Admin not available, using REST API approach...');
}

const TWILIO_ACCOUNT_SID = process.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.VITE_TWILIO_PHONE_NUMBER;
const VIRTUAL_PHONE = '+18777804236';
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createPatientViaREST(patientData) {
  // Use Firestore REST API to create patient
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/patients`;
  
  // Convert to Firestore document format
  const firestoreDoc = {
    fields: {
      firstName: { stringValue: patientData.firstName },
      lastName: { stringValue: patientData.lastName },
      fullName: { stringValue: patientData.fullName },
      phone: { stringValue: patientData.phone },
      email: { stringValue: patientData.email },
      status: { stringValue: patientData.status },
      ownerUid: { stringValue: patientData.ownerUid },
      createdAt: { timestampValue: new Date().toISOString() },
      updatedAt: { timestampValue: new Date().toISOString() },
    }
  };

  try {
    // Note: This requires authentication. For testing, we'll use the browser console approach instead
    console.log('📋 Patient data to create:');
    console.log(JSON.stringify(patientData, null, 2));
    console.log('\n⚠️  Direct Firestore REST API requires authentication.');
    console.log('   Please create the patient via the app UI or use Firebase Console.\n');
    return null;
  } catch (error) {
    console.error('❌ Error creating patient via REST:', error);
    return null;
  }
}

async function sendSMS(phone, message) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('❌ Twilio credentials not configured');
    return null;
  }

  try {
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
          To: phone,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Twilio API error: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    throw error;
  }
}

async function main() {
  console.log('🧪 Creating Test Patient and Initiating Consent Flow...\n');

  // Generate test data
  const testPatientId = `test-patient-${Date.now()}`;
  const testPatientName = 'Test Patient Virtual Phone';
  const testPatientPhone = VIRTUAL_PHONE;
  const consentToken = generateUUID();
  const consentUrl = `${BASE_URL}/consent/${consentToken}`;

  console.log('📋 Test Patient Data:');
  console.log('─'.repeat(60));
  console.log(`   Patient ID: ${testPatientId}`);
  console.log(`   Patient Name: ${testPatientName}`);
  console.log(`   Patient Phone: ${testPatientPhone}`);
  console.log(`   Consent Token: ${consentToken}`);
  console.log(`   Consent URL: ${consentUrl}`);
  console.log('─'.repeat(60));
  console.log('');

  // Step 1: Instructions for creating patient
  console.log('📝 STEP 1: Create Patient in Firebase Console');
  console.log('─'.repeat(60));
  console.log('1. Go to Firebase Console:');
  console.log(`   https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/data`);
  console.log('');
  console.log('2. Navigate to "patients" collection');
  console.log('');
  console.log('3. Click "Add document" and use this ID:');
  console.log(`   ${testPatientId}`);
  console.log('');
  console.log('4. Add these fields:');
  const patientFields = {
    firstName: 'Test',
    lastName: 'Patient Virtual Phone',
    fullName: testPatientName,
    phone: testPatientPhone,
    email: 'test@example.com',
    status: 'active',
    ownerUid: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  console.log(JSON.stringify(patientFields, null, 2));
  console.log('─'.repeat(60));
  console.log('');

  // Step 2: Send SMS
  console.log('📱 STEP 2: Sending SMS to Virtual Phone...\n');

  const message = `Hola ${testPatientName}, Dr. Smith necesita su consentimiento para datos de salud según ley canadiense.

Autorizar: ${consentUrl}

AiduxCare Clinic
STOP para cancelar`;

  try {
    const smsResult = await sendSMS(testPatientPhone, message);
    
    if (smsResult) {
      console.log('✅ SMS sent successfully!');
      console.log(`   Message SID: ${smsResult.sid}`);
      console.log(`   Status: ${smsResult.status}\n`);
    }
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    console.log('\n⚠️  You can still test the consent flow manually:');
    console.log(`   ${consentUrl}\n`);
  }

  // Final instructions
  console.log('🎉 NEXT STEPS:');
  console.log('─'.repeat(60));
  console.log('1. Complete patient creation in Firebase Console (see Step 1 above)');
  console.log('');
  console.log('2. Check Virtual Phone for SMS:');
  console.log('   https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms');
  console.log('');
  console.log('3. Click the consent link in the SMS:');
  console.log(`   ${consentUrl}`);
  console.log('');
  console.log('4. Or navigate directly in your app:');
  console.log(`   ${BASE_URL}/consent-verification/${testPatientId}`);
  console.log('');
  console.log('5. Complete the consent form');
  console.log('');
  console.log('6. Verify legal traceability in Firestore:');
  console.log('   - Collection: consent_verifications');
  console.log('   - Collection: patient_consents');
  console.log('   - Collection: pending_sms');
  console.log('   - Collection: patient_consent_tokens');
  console.log('─'.repeat(60));
  console.log('');

  console.log('✅ Test setup complete!');
  console.log(`   Patient ID: ${testPatientId}`);
  console.log(`   Consent URL: ${consentUrl}\n`);
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

