/**
 * ✅ WO-IMAGING-EXTRACTION-V1: Local test script for processImagingReport
 * Tests the function directly without emulator
 * 
 * Usage:
 *   node scripts/test-processImagingReport-local.js <storagePath>
 * 
 * Example:
 *   node scripts/test-processImagingReport-local.js "imaging-reports/EFNbuCh9WQXBvJaaAUTC/unassigned/2019-greisman-MRI Results.pdf"
 */

const path = require('path');

// Load the function module
// Path from functions/scripts/ to functions-min/src/
const processImagingReportModule = require('../../functions-min/src/processImagingReport.js');
const processImagingReport = processImagingReportModule.processImagingReport;

const storagePath = process.argv[2];

if (!storagePath) {
  console.error('❌ Error: storagePath is required');
  console.log('\nUsage:');
  console.log('  node scripts/test-processImagingReport-local.js <storagePath>');
  process.exit(1);
}

// Extract patientId and episodeId from path
const pathParts = storagePath.split('/');
if (pathParts.length < 4 || pathParts[0] !== 'imaging-reports') {
  console.error('❌ Error: Invalid storage path format');
  console.log('Expected format: imaging-reports/{patientId}/{episodeId}/{fileName}');
  process.exit(1);
}

const patientId = pathParts[1];
const episodeId = pathParts[2] === 'unassigned' ? null : pathParts[2];

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  🧪 Local Test processImagingReport                              ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

const data = {
  patientId: patientId,
  episodeId: episodeId,
  fileStoragePath: storagePath,
  modality: 'MRI',
  bodyRegion: 'lumbar',
};

const context = {
  auth: {
    uid: 'local-test-user',
    token: {
      email: 'test@example.com',
      email_verified: true,
    },
  },
};

(async () => {
  try {
    console.log('Request data:');
    console.log(`  patientId: ${data.patientId}`);
    console.log(`  episodeId: ${data.episodeId || 'null'}`);
    console.log(`  storagePath: ${data.fileStoragePath}`);
    console.log(`  modality: ${data.modality}`);
    console.log(`  bodyRegion: ${data.bodyRegion}\n`);

    console.log('▶️ Calling processImagingReport(data, context)...\n');
    
    // The function is exported as an onCall handler, so we need to call it directly
    // But onCall handlers expect a specific format, so we'll wrap it
    const result = await processImagingReport(data, context);
    
    console.log('✅ Resultado:\n');
    const report = result.report;
    
    console.log('Report created:');
    console.log(`  ID: ${report.id}`);
    console.log(`  patientId: ${report.patientId}`);
    console.log(`  episodeId: ${report.episodeId || 'null'}`);
    console.log(`  storagePath: ${report.storagePath}`);
    console.log(`  modality: ${report.modality}`);
    console.log(`  bodyRegion: ${report.bodyRegion}`);
    console.log(`  side: ${report.side}`);
    console.log(`  studyYear: ${report.studyYear || 'null'}`);
    console.log(`  isScanned: ${report.isScanned}`);
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
    console.log('  3. Verify all fields are populated correctly');
    
  } catch (err) {
    console.error('❌ Error ejecutando processImagingReport:', err);
    console.error('  Message:', err.message);
    console.error('  Stack:', err.stack);
    process.exit(1);
  }
})();

