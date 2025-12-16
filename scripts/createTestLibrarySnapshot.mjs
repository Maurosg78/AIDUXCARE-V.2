#!/usr/bin/env node

/**
 * Aidux North – Snapshot generator
 * Canonical: Physical Test Library
 * Creates a zip with the library, matching engine, UI integration and docs.
 */

import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const outputDir = path.join(process.cwd(), 'canonical_snapshots');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const timestamp = new Date().toISOString().split('T')[0];
const snapshotName = `physical-test-library-${timestamp}.zip`;
const outputPath = path.join(outputDir, snapshotName);

const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`📦 Snapshot created: ${snapshotName}`);
  console.log(`   → ${archive.pointer()} total bytes`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

const includePaths = [
  'src/core/msk-tests/',
  'src/context/SessionContext.ts',
  'src/hooks/useSharedWorkflowState.ts',
  'src/services/VertexAIServiceViaFirebase.ts',
  'docs/north/PHYSICAL_TEST_LIBRARY.md',
  'docs/north/PHYSICAL_TEST_LIBRARY_README.md',
  'docs/north/PHYSICAL_TEST_LIBRARY_CHANGELOG.md',
];

includePaths.forEach((p) => {
  archive.directory(p, p);
});

await archive.finalize();
