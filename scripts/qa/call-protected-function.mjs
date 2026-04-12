import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const email = process.env.PILOT_EMAIL;
const password = process.env.PILOT_PASSWORD;
const apiKey = process.env.VITE_FIREBASE_API_KEY;
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
const region = process.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
const action = process.env.QA_ACTION;

if (!email || !password || !apiKey || !action) {
  console.error('Missing PILOT_EMAIL, PILOT_PASSWORD, VITE_FIREBASE_API_KEY or QA_ACTION');
  process.exit(1);
}

async function signInAndGetIdToken() {
  const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const authPayload = {
    email,
    password,
    returnSecureToken: true,
  };

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(authPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Auth failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const idToken = data.idToken;
  if (!idToken) {
    throw new Error('Auth succeeded but no idToken returned.');
  }

  return idToken;
}

async function callProtectedFunction(idToken) {
  let functionName = '';
  let payload = {};

  if (action === 'vertex') {
    functionName = 'vertexAIProxy';
    payload = {
      action: 'analyze',
      prompt: 'Return a compact JSON object with a single field "status":"ok".',
      traceId: `qa-vertex-${Date.now()}`,
    };
  } else if (action === 'sms') {
    functionName = 'sendConsentSMS';
    payload = {
      phone: '+18777804236',
      message: `QA security smoke ${new Date().toISOString()}`,
      clinicName: 'AiDuxCare QA',
      patientName: 'Test Virtual Phone',
      consentToken: `qa-${Date.now()}`,
    };
  } else {
    throw new Error(`Unsupported QA_ACTION: ${action}`);
  }

  const url = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let responseJson = null;
  try {
    responseJson = JSON.parse(responseText);
  } catch (_error) {
    responseJson = null;
  }

  return {
    url,
    status: response.status,
    ok: response.ok,
    responseJson,
    responseText,
  };
}

const idToken = await signInAndGetIdToken();
const result = await callProtectedFunction(idToken);
console.log(JSON.stringify(result, null, 2));
