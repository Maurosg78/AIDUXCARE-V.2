/**
 * Test Twilio SMS Script
 * 
 * Sends a test SMS to verify Twilio integration
 * 
 * Usage: npm run test:sms
 * Or: tsx scripts/test-twilio-sms.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const TWILIO_ACCOUNT_SID = process.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.VITE_TWILIO_PHONE_NUMBER;
// For trial accounts, use Twilio Virtual Phone for testing
// Virtual Phone: https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms
const TEST_PHONE = process.env.TEST_PHONE || '+18777804236'; // Twilio Virtual Phone (trial accounts)
// To test with your real number, verify it first: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

async function testTwilioSMS() {
  console.log('🧪 Testing Twilio SMS Integration...\n');

  // Validate configuration
  if (!TWILIO_ACCOUNT_SID) {
    console.error('❌ Error: VITE_TWILIO_ACCOUNT_SID not configured');
    console.log('   Add to .env.local: VITE_TWILIO_ACCOUNT_SID=AC80346140c5f9f3ec4f186654cbde47B');
    process.exit(1);
  }

  if (!TWILIO_AUTH_TOKEN) {
    console.error('❌ Error: VITE_TWILIO_AUTH_TOKEN not configured');
    console.log('   Add to .env.local: VITE_TWILIO_AUTH_TOKEN=a12ffe32a3c8df36604cd19c0a19fb2a');
    process.exit(1);
  }

  if (!TWILIO_PHONE_NUMBER) {
    console.error('❌ Error: VITE_TWILIO_PHONE_NUMBER not configured');
    console.log('   Add to .env.local: VITE_TWILIO_PHONE_NUMBER=+1647YYYYYY');
    process.exit(1);
  }

  console.log('✅ Configuration found:');
  console.log(`   Account SID: ${TWILIO_ACCOUNT_SID.substring(0, 10)}...`);
  console.log(`   Account SID Full: ${TWILIO_ACCOUNT_SID}`);
  console.log(`   Auth Token: ${TWILIO_AUTH_TOKEN.substring(0, 10)}...`);
  console.log(`   From Number: ${TWILIO_PHONE_NUMBER}`);
  console.log(`   To Number: ${TEST_PHONE}\n`);
  
  // Verify credentials format
  if (!TWILIO_ACCOUNT_SID.startsWith('AC')) {
    console.error('❌ Error: Account SID should start with "AC"');
    process.exit(1);
  }
  
  if (TWILIO_AUTH_TOKEN.length < 30) {
    console.error('❌ Error: Auth Token seems too short');
    process.exit(1);
  }

  // Build test message
  const testMessage = `🧪 Test AiduxCare SMS

Este es un mensaje de prueba para verificar la integración de Twilio.

Si recibes este mensaje, la configuración está correcta.

Consent link: https://aiduxcare.ca/consent/test123

AiduxCare`;

  console.log('📱 Sending SMS...\n');

  try {
    // Send SMS via Twilio REST API
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
          To: TEST_PHONE,
          Body: testMessage,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Twilio API Error:');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Code: ${errorData.code}`);
      console.error(`   Message: ${errorData.message}`);
      
      if (errorData.more_info) {
        console.error(`   More info: ${errorData.more_info}`);
      }
      
      process.exit(1);
    }

    const result = await response.json();

    console.log('✅ SMS sent successfully!');
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   From: ${result.from}`);
    console.log(`   To: ${result.to}`);
    console.log(`   Date Created: ${result.date_created}\n`);
    console.log('📱 Check your phone (+16474240008) for the test message!\n');

  } catch (error: any) {
    console.error('❌ Error sending SMS:');
    console.error(`   ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run test
testTwilioSMS().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

