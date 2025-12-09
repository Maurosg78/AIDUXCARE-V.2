/**
 * ✅ WO-IR-02: Test script for processImagingReport
 * 
 * Usage:
 *   node scripts/test-processImagingReport.js <storagePath>
 * 
 * Example:
 *   node scripts/test-processImagingReport.js "imaging-reports/EFNbuCh9WQXBvJaaAUTC/unassigned/2019-greisman-MRI Results.pdf"
 * 
 * Note: Make sure Firebase emulator is running:
 *   firebase emulators:start --only functions --project aiduxcare-v2-uat-dev
 */

const https = require('https');
const http = require('http');

// Configuration
const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 5001;
const PROJECT_ID = 'aiduxcare-v2-uat-dev';
const REGION = 'northamerica-northeast1';
const FUNCTION_NAME = 'processImagingReport';

// Get storage path from command line args
const storagePath = process.argv[2];

if (!storagePath) {
  console.error('❌ Error: storagePath is required');
  console.log('\nUsage:');
  console.log('  node scripts/test-processImagingReport.js <storagePath>');
  console.log('\nExample:');
  console.log('  node scripts/test-processImagingReport.js "imaging-reports/EFNbuCh9WQXBvJaaAUTC/unassigned/2019-greisman-MRI Results.pdf"');
  process.exit(1);
}

// Extract patientId and episodeId from path
// Path format: imaging-reports/{patientId}/{episodeId}/{fileName}
// Note: fileName can contain spaces and special chars, so we need to handle that
const pathParts = storagePath.split('/');
if (pathParts.length < 4 || pathParts[0] !== 'imaging-reports') {
  console.error('❌ Error: Invalid storage path format');
  console.log('Expected format: imaging-reports/{patientId}/{episodeId}/{fileName}');
  console.log('Received:', storagePath);
  console.log('Path parts:', pathParts);
  process.exit(1);
}

const patientId = pathParts[1];
const episodeId = pathParts[2] === 'unassigned' ? null : pathParts[2];
const fileName = pathParts.slice(3).join('/');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  🧪 Test processImagingReport                                    ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

console.log('Configuration:');
console.log(`  Emulator: http://${EMULATOR_HOST}:${EMULATOR_PORT}`);
console.log(`  Function: ${FUNCTION_NAME}`);
console.log(`  Project: ${PROJECT_ID}`);
console.log(`  Region: ${REGION}\n`);

console.log('Request data:');
console.log(`  patientId: ${patientId}`);
console.log(`  episodeId: ${episodeId || 'null'}`);
console.log(`  storagePath: ${storagePath}`);
console.log(`  modality: MRI (default)`);
console.log(`  bodyRegion: lumbar (default)\n`);

// Prepare request payload
// Note: episodeId can be null for unassigned
const payload = {
  data: {
    patientId: patientId,
    episodeId: episodeId, // Can be null
    fileStoragePath: storagePath,
    modality: 'MRI',
    bodyRegion: 'lumbar',
    // userId is optional in emulator mode
  },
};

// Prepare HTTP request
const url = `http://${EMULATOR_HOST}:${EMULATOR_PORT}/${PROJECT_ID}/${REGION}/${FUNCTION_NAME}`;
const postData = JSON.stringify(payload);

const options = {
  hostname: EMULATOR_HOST,
  port: EMULATOR_PORT,
  path: `/${PROJECT_ID}/${REGION}/${FUNCTION_NAME}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    // ✅ Add Authorization header for emulator (mock token)
    'Authorization': 'Bearer mock-token-for-emulator',
  },
};

console.log('Sending request...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Response status: ${res.statusCode} ${res.statusMessage}\n`);

    try {
      const result = JSON.parse(responseData);
      
      if (res.statusCode === 200 && result.result) {
        const report = result.result.report;
        
        console.log('✅ Success!\n');
        console.log('Report created:');
        console.log(`  ID: ${report.id}`);
        console.log(`  patientId: ${report.patientId}`);
        console.log(`  episodeId: ${report.episodeId || 'null'}`);
        console.log(`  storagePath: ${report.storagePath}`);
        console.log(`  modality: ${report.modality || 'null'}`);
        console.log(`  bodyRegion: ${report.bodyRegion || 'null'}`);
        console.log(`\n  rawText: ${report.rawText ? `✅ ${report.rawText.length} chars` : '❌ null'}`);
        console.log(`  aiSummary: ${report.aiSummary ? `✅ ${report.aiSummary.length} chars` : '❌ null'}`);
        
        if (report.rawText) {
          console.log(`\n  rawText preview (first 200 chars):`);
          console.log(`  ${report.rawText.substring(0, 200)}...`);
        }
        
        if (report.aiSummary) {
          console.log(`\n  aiSummary:`);
          console.log(`  ${report.aiSummary}`);
        }
        
        console.log('\n✅ Test completed successfully!');
        console.log('\nNext steps:');
        console.log('  1. Check Firestore collection "imaging_reports"');
        console.log(`  2. Verify document ID: ${report.id}`);
        console.log('  3. Verify rawText and aiSummary fields are populated');
      } else if (result.error) {
        console.log('❌ Error response:');
        console.log(`  Status: ${result.error.status}`);
        console.log(`  Message: ${result.error.message}`);
        
        if (result.error.status === 'UNAUTHENTICATED') {
          console.log('\n💡 Tip: The function requires authentication.');
          console.log('   For emulator testing, you may need to modify the function');
          console.log('   to skip auth check in emulator mode, or use Firebase Admin SDK');
          console.log('   to generate a proper token.');
        }
      } else {
        console.log('❌ Unexpected response:');
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (e) {
      console.log('❌ Failed to parse response:');
      console.log(responseData);
      console.log('\nError:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
  console.log('\nMake sure Firebase emulator is running:');
  console.log('  firebase emulators:start --only functions --project aiduxcare-v2-uat-dev');
});

req.write(postData);
req.end();

