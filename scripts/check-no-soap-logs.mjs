#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const WORDS = ['Subjective','Objective','Assessment','Plan','SOAP'];
const coarse = spawnSync('git', [
  'grep','-nE', `console\\.(log|info|warn|error)`, '--',
  'src/**',
  ':(exclude)src/**/*.spec.*',
  ':(exclude)test/**',
  ':(exclude)node_modules/**',
  ':(exclude)coverage/**',
  ':(exclude)dist/**',
  ':(exclude)build/**',
  ':(exclude).next/**'
], { encoding: 'utf8', maxBuffer: 50*1024*1024 });

if (coarse.status > 1) {
  console.error('❌ Guardrail failed to run:\n' + (coarse.stderr || 'unknown error'));
  process.exit(2);
}

const offenders = [];
const lines = (coarse.stdout || '').split('\n').filter(Boolean);
for (const line of lines) {
  // Sólo falla si hay alguna palabra dentro de comillas en el mismo console.*
  // Ejemplo que falla: console.log("Plan ...");  // ✅
  // Ejemplo que NO falla: console.log(`... ${useOptimizedSOAP ? ...}`); // ✅ (palabra en identificador)
  const m = line.match(/console\.(log|info|warn|error)[^\n]*/);
  if (!m) continue;
  const segment = m[0];
  const quoted = segment.match(/["'`][^"'`]*["'`]/g) || [];
  const hasForbidden = quoted.some(q =>
    WORDS.some(w => new RegExp(`(^|[^A-Za-z0-9_])${w}([^A-Za-z0-9_]|$)`).test(q))
  );
  if (hasForbidden) offenders.push(line);
}

if (offenders.length) {
  console.error('❌ SOAP-like logs found:\n' + offenders.join('\n'));
  process.exit(1);
}

console.log('✅ No SOAP-like logs found.');
