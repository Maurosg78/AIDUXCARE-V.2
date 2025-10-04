#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const PATTERNS = [
  'console\\.(log|info|warn|error).*Subjective',
  'console\\.(log|info|warn|error).*Objective',
  'console\\.(log|info|warn|error).*Assessment',
  'console\\.(log|info|warn|error).*Plan',
  'console\\.(log|info|warn|error).*SOAP'
];
const regex = `(${PATTERNS.join('|')})`;

// Only scan tracked code under src/ and scripts/, exclude tests/specs and noisy dirs
const pathspecs = [
  'src/**',
  'scripts/**',
  ':(exclude)test/**',
  ':(exclude)src/**/*.spec.*',
  ':(exclude)scripts/**/*.spec.*',
  ':(exclude).rescue_untracked/**',
  ':(exclude)node_modules/**',
  ':(exclude)coverage/**',
  ':(exclude)dist/**',
  ':(exclude)build/**',
  ':(exclude).next/**',
];

const res = spawnSync('git', ['grep', '-nE', regex, '--', ...pathspecs], {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024 // 50MB headroom
});

// git grep: 0=found, 1=not found, >1=error
if (res.status === 0 && res.stdout && res.stdout.trim()) {
  console.error('❌ SOAP-like logs found:\n' + res.stdout.trim());
  process.exit(1);
}

if (res.status > 1) {
  console.error('❌ Guardrail failed to run:\n' + (res.stderr || 'unknown error'));
  process.exit(2);
}

console.log('✅ No SOAP-like logs found.');
