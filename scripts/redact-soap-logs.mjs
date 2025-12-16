#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const WORDS = [
  {from:'SOAP',        to:'clinical note'},
  {from:'Subjective',  to:'subjective section'},
  {from:'Objective',   to:'objective section'},
  {from:'Assessment',  to:'assessment section'},
  {from:'Plan',        to:'plan section'}
];

const pathspecs = [
  'src/**',
  ':(exclude)src/**/*.spec.*',
  ':(exclude)src/**/__tests__/**',
  ':(exclude)src/**/*backup*',
  ':(exclude)src/**/*.backup*',
  ':(exclude)src/**/*~',
];

const res = spawnSync('git', ['grep','-lE','console\\.(log|info|warn|error).*(SOAP|Subjective|Objective|Assessment|Plan)','--',...pathspecs], {encoding:'utf8'});
const files = (res.stdout || '').split('\n').filter(Boolean);

let changed = 0;
for (const f of files) {
  let txt = fs.readFileSync(f,'utf8');
  const before = txt;

  // línea a línea; modificar solo strings en llamadas a console.*
  txt = txt.split('\n').map(line => {
    if (!/console\.(log|info|warn|error)/.test(line)) return line;

    return line.replace(/(["'`])([^"'`]*?)\1/g, (m, q, inner) => {
      let out = inner;
      for (const {from,to} of WORDS) {
        const re = new RegExp(`\\b${from}\\b`, 'g');
        out = out.replace(re, to);
      }
      return q + out + q;
    });
  }).join('\n');

  if (txt !== before) {
    fs.writeFileSync(f, txt);
    console.log('redacted', f);
    changed++;
  }
}

console.log(changed ? `✅ Redacted ${changed} file(s)` : '✅ Nothing to redact');
