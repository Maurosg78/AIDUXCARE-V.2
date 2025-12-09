/**
 * ✅ WO-IMAGING-EXTRACTION-V1: List files in Firebase Storage
 * Helps find the correct path for PDF files
 * 
 * Usage:
 *   node scripts/list-storage-files.js [prefix]
 * 
 * Example:
 *   node scripts/list-storage-files.js "imaging-reports/"
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: 'aiduxcare-v2-uat-dev.firebasestorage.app',
  });
}

const storage = admin.storage();
const prefix = process.argv[2] || 'imaging-reports/';

async function listFiles() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  📁 List Files in Firebase Storage                               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log('Bucket:', 'aiduxcare-v2-uat-dev.firebasestorage.app');
  console.log('Prefix:', prefix);
  console.log('');

  try {
    const bucket = storage.bucket();
    
    console.log('Listing files...\n');
    
    const [files] = await bucket.getFiles({ prefix });
    
    if (files.length === 0) {
      console.log('❌ No files found with prefix:', prefix);
      console.log('\nTrying to list all files in bucket...\n');
      
      const [allFiles] = await bucket.getFiles({ maxResults: 50 });
      
      if (allFiles.length === 0) {
        console.log('❌ No files found in bucket at all');
        console.log('\nPossible causes:');
        console.log('  • Bucket is empty');
        console.log('  • Wrong bucket name');
        console.log('  • No access permissions');
        return;
      }
      
      console.log(`Found ${allFiles.length} files (showing first 20):\n`);
      allFiles.slice(0, 20).forEach((file, idx) => {
        console.log(`${idx + 1}. ${file.name}`);
      });
      
      if (allFiles.length > 20) {
        console.log(`\n... and ${allFiles.length - 20} more files`);
      }
      
      return;
    }
    
    console.log(`✅ Found ${files.length} files:\n`);
    
    files.forEach((file, idx) => {
      console.log(`${idx + 1}. ${file.name}`);
      
      // Show metadata if available
      file.getMetadata().then(([metadata]) => {
        console.log(`   Size: ${metadata.size} bytes`);
        console.log(`   Content-Type: ${metadata.contentType}`);
        console.log(`   Created: ${metadata.timeCreated}`);
        console.log('');
      }).catch(() => {
        // Ignore metadata errors
      });
    });
    
    // Show first file details
    if (files.length > 0) {
      console.log('\n📋 First file details:');
      const firstFile = files[0];
      const [metadata] = await firstFile.getMetadata();
      console.log(`   Name: ${firstFile.name}`);
      console.log(`   Size: ${metadata.size} bytes`);
      console.log(`   Content-Type: ${metadata.contentType}`);
      console.log(`   Created: ${metadata.timeCreated}`);
      console.log(`   Updated: ${metadata.updated}`);
      
      console.log('\n💡 Use this path in diagnose-pdf-extraction.js:');
      console.log(`   node scripts/diagnose-pdf-extraction.js "${firstFile.name}"`);
    }
    
  } catch (error) {
    console.error('❌ Error listing files:');
    console.error('  Error:', error.message);
    console.error('  Stack:', error.stack);
  }
}

listFiles().then(() => {
  console.log('\n✅ Listing complete');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Listing failed:', error);
  process.exit(1);
});

