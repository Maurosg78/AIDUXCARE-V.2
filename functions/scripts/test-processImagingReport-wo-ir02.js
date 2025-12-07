'use strict';

const { processImagingReport } = require('../../functions-min/src/processImagingReport.js');

async function main() {
  const storagePath = process.argv[2];

  if (!storagePath) {
    console.error('❌ Error: storagePath is required\n');
    console.error('Usage:');
    console.error('  node scripts/test-processImagingReport-wo-ir02.js <storagePath>');
    process.exit(1);
  }

  const data = {
    patientId: 'EFNbuCh9WQXBvJaaAUTC',
    episodeId: null,
    fileStoragePath: storagePath,
    modality: 'MRI',       // para los Greisman
    bodyRegion: 'lumbar',  // lo que quieres forzar en este test
    userId: 'local-test-user',
    source: 'upload',
  };

  const context = {
    auth: {
      uid: 'local-test-user',
      token: {
        email: 'test@example.com',
        email_verified: true,
      },
    },
    rawRequest: {}, // stub para evitar que nada reviente
  };

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 WO-IR-02: Test processImagingReport                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  console.log('Request data:');
  console.log(`  patientId:   ${data.patientId}`);
  console.log(`  episodeId:   ${data.episodeId}`);
  console.log(`  storagePath: ${data.fileStoragePath}`);
  console.log(`  modality:    ${data.modality}`);
  console.log(`  bodyRegion:  ${data.bodyRegion}\n`);

  try {
    console.log('▶️ Calling processImagingReport.run(data, context)...\n');
    const result = await processImagingReport.run(data, context);

    console.log('✅ Raw result from function:');
    console.dir(result, { depth: null });

    const report = result && (result.report || result);
    const rawText = report && report.rawText;
    const aiSummary = report && report.aiSummary;

    console.log('\n── DoD quick checks ──');
    console.log(`  • rawText present:   ${!!rawText}`);
    console.log(`  • aiSummary present: ${!!aiSummary}`);
    console.log(`  • modality:          ${report && report.modality}`);
    console.log(`  • bodyRegion:        ${report && report.bodyRegion}`);

    if (rawText && rawText.length >= 200 && aiSummary && aiSummary.length > 0) {
      console.log('\n✅ WO-IR-02 DoD checks passed.');
    } else {
      console.log('\n⚠️ WO-IR-02 DoD checks NOT fully met, please inspect output above.');
    }
  } catch (err) {
    console.error('\n❌ Error ejecutando processImagingReport.run:', err);
    process.exitCode = 1;
  }
}

main();
