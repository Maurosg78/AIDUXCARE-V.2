import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const allowlistPath = path.join(repoRoot, '.github', 'direct-write-facade-allowlist.json');
const { allowedWriterFiles } = JSON.parse(readFileSync(allowlistPath, 'utf8'));
const allowedFiles = new Set(allowedWriterFiles);

const TARGET_FILE_RE = /^src\/.*\.(js|jsx|ts|tsx)$/;
const TEST_FILE_RE = /(^|\/)__tests__\/|\.test\.(js|jsx|ts|tsx)$|\.spec\.(js|jsx|ts|tsx)$/;
export const FORBIDDEN_WRITE_RE = /\b(setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\s*\(|\.(insert|update|upsert|delete)\s*\(/;

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function resolveBaseHead() {
  const envBase = process.env.BASE_SHA;
  const envHead = process.env.HEAD_SHA;
  if (envBase && envHead) {
    return { base: envBase, head: envHead };
  }

  const candidates = [
    ['merge-base', 'HEAD', 'origin/main'],
    ['merge-base', 'HEAD', 'main'],
  ];

  for (const args of candidates) {
    try {
      const base = git(args);
      if (base) {
        return { base, head: 'HEAD' };
      }
    } catch {
      // Try next candidate.
    }
  }

  try {
    const base = git(['rev-parse', 'HEAD^']);
    if (base) {
      console.warn('WARN: origin/main not available; falling back to HEAD^..HEAD for local smoke check.');
      return { base, head: 'HEAD' };
    }
  } catch {
    // Fall through to hard failure.
  }

  throw new Error(
    'Unable to resolve BASE_SHA/HEAD_SHA. Set BASE_SHA and HEAD_SHA, fetch origin/main, or run from a branch with at least one local commit.'
  );
}

function listChangedFiles(base, head) {
  const output = git(['diff', '--name-only', `${base}..${head}`]);
  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => TARGET_FILE_RE.test(file))
    .filter((file) => !TEST_FILE_RE.test(file));
}

export function scanPatchForViolations(diff, file) {
  if (!diff) {
    return [];
  }

  const violations = [];
  let currentLine = 0;

  for (const line of diff.split('\n')) {
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentLine = Number.parseInt(hunkMatch[1], 10);
      continue;
    }

    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff --git') || line.startsWith('index ')) {
      continue;
    }

    if (line.startsWith('+')) {
      const content = line.slice(1);
      if (FORBIDDEN_WRITE_RE.test(content)) {
        violations.push({ file, line: currentLine, content: content.trim() });
      }
      currentLine += 1;
      continue;
    }

    if (line.startsWith(' ')) {
      currentLine += 1;
    }
  }

  return violations;
}

export function findViolationsForFile(file, diff, allowedFileSet = allowedFiles) {
  if (allowedFileSet.has(file)) {
    return [];
  }

  return scanPatchForViolations(diff, file);
}

function scanDiffForViolations(base, head, file) {
  const diff = git(['diff', '--unified=0', '--no-color', `${base}..${head}`, '--', file]);
  return findViolationsForFile(file, diff);
}

function main() {
  const { base, head } = resolveBaseHead();
  const changedFiles = listChangedFiles(base, head);
  const violations = [];

  for (const file of changedFiles) {
    if (allowedFiles.has(file)) {
      continue;
    }

    violations.push(...scanDiffForViolations(base, head, file));
  }

  if (violations.length === 0) {
    console.log(`OK: no new direct datastore writers outside the facade between ${base} and ${head}.`);
    return;
  }

  console.error('Direct datastore writers were added outside the approved facade:');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} -> ${violation.content}`);
  }
  console.error('');
  console.error('Allowed facade files:');
  for (const file of allowedFiles) {
    console.error(`- ${file}`);
  }
  console.error('');
  console.error('Move the write behind the facade or update the allowlist intentionally with ADR coverage.');
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
