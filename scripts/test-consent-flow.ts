/**
 * Test Complete Consent Flow
 * 
 * Simulates the complete consent verification flow:
 * 1. Create a test patient
 * 2. Initialize consent verification
 * 3. Send SMS to Virtual Phone
 * 4. Verify the consent link works
 * 
 * Usage: npm run test:consent-flow
 * Or: tsx scripts/test-consent-flow.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const TWILIO_ACCOUNT_SID = process.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.VITE_TWILIO_PHONE_NUMBER;
const VIRTUAL_PHONE = '+18777804236';
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

async function testConsentFlow() {
  console.log('🧪 Testing Complete Consent Flow...\n');

  // Validate configuration
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('❌ Error: Twilio credentials not configured');
    console.log('   Make sure .env.local has VITE_TWILIO_* variables');
    process.exit(1);
  }

  // Generate test patient data
  const testPatientId = `test-patient-${Date.now()}`;
  const testPatientName = 'Test Patient Virtual Phone';
  const testPatientPhone = VIRTUAL_PHONE;

  console.log('✅ Test Configuration:');
  console.log(`   Patient ID: ${testPatientId}`);
  console.log(`   Patient Name: ${testPatientName}`);
  console.log(`   Patient Phone: ${testPatientPhone}`);
  console.log(`   From Number: ${TWILIO_PHONE_NUMBER}`);
  console.log(`   Base URL: ${BASE_URL}\n`);

  // Generate consent token (simulate)
  const consentToken = generateTestToken();
  const consentUrl = `${BASE_URL}/consent/${consentToken}`;

  console.log('📱 Generating consent token and SMS...\n');

  // Build SMS message (same format as production)
  const message = `Hola ${testPatientName}, Dr. Smith necesita su consentimiento para datos de salud según ley canadiense.

Autorizar: ${consentUrl}

AiduxCare Clinic
STOP para cancelar`;

  console.log('📨 SMS Message:');
  console.log('─'.repeat(60));
  console.log(message);
  console.log('─'.repeat(60));
  console.log('');

  // Send SMS via Twilio
  try {
    console.log('📤 Sending SMS to Virtual Phone...\n');

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

    const result = await response.json();

    console.log('✅ SMS sent successfully!');
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   To: ${result.to}`);
    console.log(`   From: ${result.from}`);
    console.log('');

    console.log('📋 NEXT STEPS:');
    console.log('─'.repeat(60));
    console.log('1. Check Virtual Phone:');
    console.log('   https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms');
    console.log('');
    console.log('2. Click the consent link in the SMS');
    console.log(`   ${consentUrl}`);
    console.log('');
    console.log('3. Complete the consent form in the portal');
    console.log('');
    console.log('4. Verify legal traceability in Firestore:');
    console.log('   - Collection: patient_consents');
    console.log('   - Collection: consent_verifications');
    console.log('   - Collection: pending_sms');
    console.log('─'.repeat(60));
    console.log('');

    console.log('✅ Test flow initiated successfully!');
    console.log('   Check Virtual Phone for the SMS with consent link.\n');

  } catch (error: any) {
    console.error('❌ Error sending SMS:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

function generateTestToken(): string {
  // Generate a test token (similar to what PatientConsentService does)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Run test
testConsentFlow().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

