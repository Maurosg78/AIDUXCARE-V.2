#!/usr/bin/env node
import { execSync } from 'node:child_process';

const PATTERNS = [
  'console\\.(log|info|warn|error).*Subjective',
  'console\\.(log|info|warn|error).*Objective',
  'console\\.(log|info|warn|error).*Assessment',
  'console\\.(log|info|warn|error).*Plan',
  'console\\.(log|info|warn|error).*SOAP'
];

const cmd = `git grep -nE "(${PATTERNS.join('|')})" -- ':!**/*.spec.*' ':!test/**' || true`;
const out = execSync(cmd, { encoding: 'utf8' });
if (out.trim()) {
  console.error('❌ SOAP-like logs found:\n' + out);
  process.exit(1);
}
console.log('✅ No SOAP-like logs found.');
