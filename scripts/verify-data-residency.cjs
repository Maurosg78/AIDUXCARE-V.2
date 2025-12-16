#!/usr/bin/env node

/**
 * Data Residency Verification Script
 * 
 * Verifies that Firebase services are configured for Canadian regions
 * Note: Actual region verification requires Firebase Console access
 */

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

console.log('🇨🇦 DATA RESIDENCY VERIFICATION SCRIPT\n');
console.log('==========================================\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.projectId) {
  console.error('❌ ERROR: Firebase configuration not found');
  console.error('Please ensure .env.local contains VITE_FIREBASE_PROJECT_ID');
  process.exit(1);
}

console.log('📋 FIREBASE CONFIGURATION:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Storage Bucket: ${firebaseConfig.storageBucket}`);
console.log('');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('✅ Firebase initialized\n');

console.log('⚠️  IMPORTANT: Region verification requires Firebase Console access');
console.log('');
console.log('📋 MANUAL VERIFICATION STEPS:');
console.log('');
console.log('1. FIRESTORE REGION:');
console.log('   a. Go to: https://console.firebase.google.com');
console.log('   b. Select project:', firebaseConfig.projectId);
console.log('   c. Navigate to: Firestore Database → Settings (gear icon)');
console.log('   d. Check: Database location field');
console.log('   e. Required: northamerica-northeast1 (Montreal, Canada)');
console.log('   f. Take screenshot');
console.log('');
console.log('2. STORAGE REGION:');
console.log('   a. Go to: https://console.firebase.google.com');
console.log('   b. Select project:', firebaseConfig.projectId);
console.log('   c. Navigate to: Storage → Settings (gear icon)');
console.log('   d. Check: Bucket location field');
console.log('   e. Required: northamerica-northeast1 (Montreal, Canada)');
console.log('   f. Take screenshot');
console.log('');
console.log('3. FUNCTIONS REGION:');
console.log('   a. Go to: https://console.firebase.google.com');
console.log('   b. Select project:', firebaseConfig.projectId);
console.log('   c. Navigate to: Functions → Settings');
console.log('   d. Check: Region configuration');
console.log('   e. Required: northamerica-northeast1 (Montreal, Canada)');
console.log('   f. Take screenshot');
console.log('');
console.log('4. SUPABASE REGION:');
console.log('   a. Go to: https://app.supabase.com');
console.log('   b. Select project');
console.log('   c. Navigate to: Project Settings → Infrastructure');
console.log('   d. Check: Region field');
console.log('   e. Required: Canada region (ca-central-1 or equivalent)');
console.log('   f. Take screenshot');
console.log('');
console.log('🚨 IF ANY REGION IS NOT CANADIAN:');
console.log('   → STOP WORK IMMEDIATELY');
console.log('   → ESCALATE TO CTO');
console.log('   → DO NOT PROCEED until migration planned');
console.log('');
console.log('📝 DOCUMENTATION:');
console.log('   Update: docs/north/DATA_RESIDENCY_VERIFICATION.md');
console.log('   Include: Screenshots, region codes, verification date');
console.log('');

// Check code for Functions region
console.log('🔍 CODE VERIFICATION:');
const fs = require('fs');
const path = require('path');

const assistantAdapterPath = path.join(__dirname, '../src/core/assistant/assistantAdapter.ts');
if (fs.existsSync(assistantAdapterPath)) {
  const content = fs.readFileSync(assistantAdapterPath, 'utf8');
  if (content.includes('northamerica-northeast1')) {
    console.log('   ✅ Functions region in code: northamerica-northeast1');
  } else if (content.includes('europe-west1')) {
    console.log('   ❌ Functions region in code: europe-west1 (INCORRECT)');
    console.log('   → Update required to northamerica-northeast1');
  } else {
    console.log('   ⚠️  Functions region not found in code');
  }
} else {
  console.log('   ⚠️  assistantAdapter.ts not found');
}

console.log('');
console.log('✅ Verification script complete');
console.log('');
console.log('📋 NEXT STEPS:');
console.log('   1. Access Firebase Console');
console.log('   2. Verify all regions manually');
console.log('   3. Document results in DATA_RESIDENCY_VERIFICATION.md');
console.log('   4. If all regions Canadian → Proceed to Task 2');
console.log('   5. If any region NOT Canadian → STOP WORK → ESCALATE CTO');
console.log('');

process.exit(0);

