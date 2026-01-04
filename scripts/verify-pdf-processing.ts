import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function verify() {
  console.log('🔍 Verifying PDF processing implementation...\n');
  
  let hasErrors = false;
  
  // Check 1: Files exist
  console.log('✓ Checking files exist...');
  const files = [
    'src/services/pdfTextExtractor.ts',
    'src/services/FileProcessorService.ts',
    'src/services/clinicalAttachmentService.ts',
  ];
  
  for (const file of files) {
    if (existsSync(file)) {
      console.log(`  ✓ ${file}`);
    } else {
      console.error(`  ✗ ${file} NOT FOUND`);
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    console.error('\n❌ Some files are missing. Aborting verification.');
    process.exit(1);
  }
  
  // Check 2: Imports correct
  console.log('\n✓ Checking imports...');
  const fileProcessor = readFileSync('src/services/FileProcessorService.ts', 'utf-8');
  const clinicalAttachment = readFileSync('src/services/clinicalAttachmentService.ts', 'utf-8');
  const pdfExtractor = readFileSync('src/services/pdfTextExtractor.ts', 'utf-8');
  
  if (!fileProcessor.includes('extractTextFromPDF')) {
    console.error('  ✗ FileProcessorService missing extractTextFromPDF import');
    hasErrors = true;
  } else {
    console.log('  ✓ FileProcessorService imports extractTextFromPDF');
  }
  
  if (!fileProcessor.includes('isValidPDF')) {
    console.error('  ✗ FileProcessorService missing isValidPDF import');
    hasErrors = true;
  } else {
    console.log('  ✓ FileProcessorService imports isValidPDF');
  }
  
  if (!clinicalAttachment.includes('import { FileProcessorService')) {
    console.error('  ✗ clinicalAttachmentService missing FileProcessorService import');
    hasErrors = true;
  } else {
    console.log('  ✓ clinicalAttachmentService imports FileProcessorService');
  }
  
  if (!pdfExtractor.includes('extractTextFromPDF')) {
    console.error('  ✗ pdfTextExtractor missing extractTextFromPDF export');
    hasErrors = true;
  } else {
    console.log('  ✓ pdfTextExtractor exports extractTextFromPDF');
  }
  
  if (!pdfExtractor.includes('isValidPDF')) {
    console.error('  ✗ pdfTextExtractor missing isValidPDF export');
    hasErrors = true;
  } else {
    console.log('  ✓ pdfTextExtractor exports isValidPDF');
  }
  
  // Check 3: Interfaces updated
  console.log('\n✓ Checking interfaces...');
  if (!fileProcessor.includes('export interface ProcessedFile')) {
    console.error('  ✗ ProcessedFile interface not found');
    hasErrors = true;
  } else {
    console.log('  ✓ ProcessedFile interface exists');
    
    // Check required fields
    const requiredFields = ['fileName', 'fileType', 'fileSize', 'downloadURL'];
    const optionalFields = ['extractedText', 'pageCount', 'metadata', 'error'];
    
    for (const field of requiredFields) {
      if (!fileProcessor.includes(`${field}:`)) {
        console.error(`  ✗ ProcessedFile missing required field: ${field}`);
        hasErrors = true;
      }
    }
    
    for (const field of optionalFields) {
      if (!fileProcessor.includes(`${field}?:`)) {
        console.error(`  ✗ ProcessedFile missing optional field: ${field}`);
        hasErrors = true;
      }
    }
    
    if (!hasErrors) {
      console.log('  ✓ ProcessedFile interface has all required fields');
    }
  }
  
  if (!clinicalAttachment.includes('extractedText?:')) {
    console.error('  ✗ ClinicalAttachment missing extractedText field');
    hasErrors = true;
  } else {
    console.log('  ✓ ClinicalAttachment interface has extractedText field');
  }
  
  if (!clinicalAttachment.includes('pageCount?:')) {
    console.error('  ✗ ClinicalAttachment missing pageCount field');
    hasErrors = true;
  } else {
    console.log('  ✓ ClinicalAttachment interface has pageCount field');
  }
  
  if (!clinicalAttachment.includes('metadata?:')) {
    console.error('  ✗ ClinicalAttachment missing metadata field');
    hasErrors = true;
  } else {
    console.log('  ✓ ClinicalAttachment interface has metadata field');
  }
  
  // Check 4: Method signatures
  console.log('\n✓ Checking method signatures...');
  
  if (!fileProcessor.includes('static async processFile(')) {
    console.error('  ✗ FileProcessorService.processFile method not found');
    hasErrors = true;
  } else {
    // Check it accepts (file: File, downloadURL: string)
    if (!fileProcessor.includes('file: File') || !fileProcessor.includes('downloadURL: string')) {
      console.error('  ✗ FileProcessorService.processFile has incorrect signature');
      hasErrors = true;
    } else {
      console.log('  ✓ FileProcessorService.processFile signature correct');
    }
    
    // Check it returns ProcessedFile
    if (!fileProcessor.includes(': Promise<ProcessedFile>')) {
      console.error('  ✗ FileProcessorService.processFile return type incorrect');
      hasErrors = true;
    } else {
      console.log('  ✓ FileProcessorService.processFile return type correct');
    }
  }
  
  if (!clinicalAttachment.includes('FileProcessorService.processFile')) {
    console.error('  ✗ clinicalAttachmentService.upload() not calling FileProcessorService.processFile');
    hasErrors = true;
  } else {
    console.log('  ✓ clinicalAttachmentService.upload() calls FileProcessorService.processFile');
  }
  
  // Final result
  console.log('');
  if (hasErrors) {
    console.error('❌ Verification failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log('✅ All checks passed!\n');
  }
}

verify().catch((error) => {
  console.error('❌ Verification script error:', error);
  process.exit(1);
});

