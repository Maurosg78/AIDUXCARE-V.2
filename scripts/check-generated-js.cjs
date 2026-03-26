const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');

const allowedJsFiles = new Set([
  'src/core/ai/PromptFactory-Canada.js',
  'src/core/ai/markets/buildAnalysisPrompt.js',
  'src/core/ai/markets/buildAnalysisPrompt.shared.js',
  'src/core/ai/markets/ca/buildAnalysisPrompt.ca.js',
  'src/core/ai/markets/es/buildAnalysisPrompt.es.js',
  'src/core/firebase/firebaseClient.js',
  'src/core/market/resolveClinicalMarket.js',
  'src/core/prompts/marketLocales.js',
  'src/hooks/useNiagaraProcessor.js',
  'src/integrations/firebase/firebase.js',
  'src/integrations/firebase/index.js',
  'src/services/vertex-ai-service-firebase.js',
  'src/test-watchdog.js',
  'src/utils/cleanVertexResponse.js',
  'src/utils/fix-parser.js',
  'src/utils/normalizers/ca/normalizeClinicalResponse.ca.js',
  'src/utils/normalizers/es/containsForbiddenEnglishInEsClinicalFields.js',
  'src/utils/normalizers/es/normalizeClinicalResponse.es.js',
  'src/utils/normalizers/normalizeClinicalResponse.js',
  'src/utils/normalizers/normalizeClinicalResponse.shared.js',
]);

function collectJavaScriptFiles(currentDir, results) {
  const directoryEntries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    const entryName = directoryEntry.name;
    const absolutePath = path.join(currentDir, entryName);

    if (directoryEntry.isDirectory()) {
      collectJavaScriptFiles(absolutePath, results);
      continue;
    }

    const isJavaScriptFile = entryName.endsWith('.js');
    const isJsxFile = entryName.endsWith('.jsx');
    const shouldCollect = isJavaScriptFile || isJsxFile;

    if (!shouldCollect) {
      continue;
    }

    const relativePath = path.relative(repoRoot, absolutePath);
    const normalizedPath = relativePath.split(path.sep).join('/');

    results.push(normalizedPath);
  }
}

function buildTwinCandidates(filePath) {
  const extension = path.extname(filePath);
  const fileStem = filePath.slice(0, -extension.length);

  const candidates = [];

  candidates.push(`${fileStem}.ts`);
  candidates.push(`${fileStem}.tsx`);

  return candidates;
}

function findUnexpectedJavaScriptFiles(allJavaScriptFiles) {
  const unexpectedFiles = [];

  for (const filePath of allJavaScriptFiles) {
    const isAllowed = allowedJsFiles.has(filePath);

    if (isAllowed) {
      continue;
    }

    unexpectedFiles.push(filePath);
  }

  return unexpectedFiles;
}

function formatTwinHint(filePath) {
  const twinCandidates = buildTwinCandidates(filePath);
  const existingTwinCandidates = [];

  for (const twinCandidate of twinCandidates) {
    const absoluteTwinPath = path.join(repoRoot, twinCandidate);
    const twinExists = fs.existsSync(absoluteTwinPath);

    if (!twinExists) {
      continue;
    }

    existingTwinCandidates.push(twinCandidate);
  }

  const hasExistingTwin = existingTwinCandidates.length > 0;

  if (!hasExistingTwin) {
    return 'No TypeScript twin detected. If this file is intentional, add it to the allowlist in scripts/check-generated-js.cjs.';
  }

  const twinList = existingTwinCandidates.join(', ');

  return `TypeScript source-of-truth detected: ${twinList}. Remove the generated JS file or justify it explicitly in the allowlist.`;
}

function main() {
  const allJavaScriptFiles = [];

  collectJavaScriptFiles(srcRoot, allJavaScriptFiles);

  const unexpectedFiles = findUnexpectedJavaScriptFiles(allJavaScriptFiles);
  const hasUnexpectedFiles = unexpectedFiles.length > 0;

  if (!hasUnexpectedFiles) {
    console.log('✅ No unexpected JavaScript files detected inside src/.');
    console.log(`ℹ️ Allowed exceptions: ${allowedJsFiles.size}`);
    return;
  }

  console.error('❌ Unexpected JavaScript files detected inside src/.');
  console.error('These files can shadow TypeScript modules and cause ambiguous Vite resolution.');
  console.error('Allowed JS files are explicitly allowlisted. Any new JS file under src/ must be justified first.');

  for (const filePath of unexpectedFiles) {
    const twinHint = formatTwinHint(filePath);

    console.error('');
    console.error(`- ${filePath}`);
    console.error(`  ${twinHint}`);
  }

  console.error('');
  console.error('How to fix:');
  console.error('1. Remove the accidental generated JS file from src/.');
  console.error('2. Keep the TypeScript file as the source of truth.');
  console.error('3. Only if the JS file is intentional, add it to the allowlist in scripts/check-generated-js.cjs.');

  process.exitCode = 1;
}

main();
