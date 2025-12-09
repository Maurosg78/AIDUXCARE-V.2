#!/usr/bin/env node

/**
 * Lista archivos en Firebase Storage para debug rápido.
 * Uso:
 *   node scripts/list-st.js                # lista imaging-reports/
 *   node scripts/list-st.js some/prefix/   # lista ese prefijo
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: 'aiduxcare-v2-uat-dev.firebasestorage.app',
  });
}

const storage = admin.storage();

async function main() {
  const prefix = process.argv[2] || 'imaging-reports/';
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   📂 Listando archivos en Cloud Storage   ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('Bucket:', admin.app().options.storageBucket);
  console.log('Prefix:', prefix);
  console.log('');

  const bucket = storage.bucket();
  const [files] = await bucket.getFiles({ prefix });

  if (!files.length) {
    console.log('⚠️  No se encontraron archivos para ese prefijo.');
    return;
  }

  console.log(`✅ Encontrados ${files.length} archivo(s):`);
  for (const f of files) {
    const meta = f.metadata || {};
    const size = meta.size ? `${meta.size} bytes` : 'size: ?';
    const ct = meta.contentType || 'contentType: ?';
    console.log(`- ${f.name}`);
    console.log(`    ↳ ${size} | ${ct}`);
  }
}

main().catch((err) => {
  console.error('❌ Error listando Storage:', err.message || err);
  process.exit(1);
});
