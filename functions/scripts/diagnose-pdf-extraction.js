/**
 * ✅ WO-IR-02: Diagnostic script for PDF extraction
 * Tests PDF extraction directly without going through Cloud Function
 * 
 * Usage:
 *   node scripts/diagnose-pdf-extraction.js <storagePath>
 */

const admin = require('firebase-admin');
const pdf = require('pdf-parse'); // ✅ v1.1.1 - direct function export

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
  storageBucket: 'aiduxcare-v2-uat-dev.firebasestorage.app',
});
}

const storage = admin.storage();

const storagePath = process.argv[2];

if (!storagePath) {
  console.error('❌ Error: storagePath is required');
  console.log('\nUsage:');
  console.log('  node scripts/diagnose-pdf-extraction.js <storagePath>');
  process.exit(1);
}

async function diagnose() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 PDF Extraction Diagnosis                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log('Storage Path:', storagePath);
  console.log('');

  try {
    // Step 1: Check if file exists
    console.log('Step 1: Checking if file exists in Storage...');
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      console.error('❌ File does NOT exist in Storage');
      console.log('\nPossible causes:');
      console.log('  • File was never uploaded');
      console.log('  • Wrong storage path');
      console.log('  • Storage bucket not accessible');
      return;
    }
    console.log('✅ File exists in Storage\n');

    // Step 2: Get file metadata
    console.log('Step 2: Getting file metadata...');
    const [metadata] = await file.getMetadata();
    console.log('  Size:', metadata.size, 'bytes');
    console.log('  Content-Type:', metadata.contentType);
    console.log('  Created:', metadata.timeCreated);
    console.log('');

    // Step 3: Download file
    console.log('Step 3: Downloading PDF...');
    const [pdfBuffer] = await file.download();
    console.log('✅ PDF downloaded, buffer size:', pdfBuffer.length, 'bytes\n');

    // Step 4: Check pdf-parse API (v1.1.1)
    console.log('Step 4: Checking pdf-parse API (v1.1.1)...');
    console.log('  pdf type:', typeof pdf);
    console.log('  pdf.default type:', typeof pdf.default);
    console.log('');

    // Step 5: Try parsing with pdf-parse v1.1.1 (direct function)
    console.log('Step 5: Parsing PDF with pdf-parse v1.1.1...');
    let pdfData = null;
    let parseMethod = '';

    try {
      if (typeof pdf === 'function') {
        parseMethod = 'pdf(buffer)';
        console.log('  Using:', parseMethod);
        pdfData = await pdf(pdfBuffer);
      } else if (pdf.default && typeof pdf.default === 'function') {
        parseMethod = 'pdf.default(buffer)';
        console.log('  Using:', parseMethod);
        pdfData = await pdf.default(pdfBuffer);
      } else {
        console.error('❌ pdf-parse is not a function');
        console.error('  pdf type:', typeof pdf);
        console.error('  Available keys:', Object.keys(pdf || {}));
        return;
      }

      console.log('✅ Parsing successful using:', parseMethod);
      console.log('  Result type:', typeof pdfData);
      console.log('  Result keys:', Object.keys(pdfData || {}));
      console.log('');

      // Step 6: Extract text
      console.log('Step 6: Extracting text...');
      if (!pdfData || typeof pdfData.text !== 'string') {
        console.error('❌ pdfData.text is not a string');
        console.log('  pdfData:', pdfData);
        return;
      }

      const text = pdfData.text.trim();
      console.log('✅ Text extracted');
      console.log('  Text length:', text.length, 'characters');
      console.log('  Text preview (first 200 chars):');
      console.log('  ' + text.substring(0, 200).replace(/\n/g, '\\n'));
      console.log('');

      if (text.length < 50) {
        console.warn('⚠️  Text is too short (<50 chars)');
        console.warn('  This PDF might be scanned/image-only');
        console.warn('  Full text:', text);
      } else {
        console.log('✅ Text extraction successful!');
        console.log('  Text is long enough for processing');
      }

    } catch (parseError) {
      console.error('❌ Parsing failed:');
      console.error('  Error:', parseError.message);
      console.error('  Stack:', parseError.stack);
      return;
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:');
    console.error('  Error:', error.message);
    console.error('  Stack:', error.stack);
  }
}

diagnose().then(() => {
  console.log('\n✅ Diagnosis complete');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Diagnosis failed:', error);
  process.exit(1);
});

