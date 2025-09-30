#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';

const NORTH_DIR = 'docs/north';
const REDIRECTS = join(NORTH_DIR, '_redirects');
const PR_TPL = '.github/pull_request_template.md';

function splitLines(s){ return s.replace(/\r\n/g,'\n').split('\n'); }

async function readIf(p){ try{ return await fs.readFile(p,'utf8'); } catch{ return ''; } }

async function walk(dir){
  const out=[];
  async function recur(d){
    const ents = await fs.readdir(d,{ withFileTypes:true });
    for (const e of ents){
      if(e.isDirectory()) await recur(join(d,e.name));
      else if (e.isFile() && e.name.endsWith('.md')) out.push(join(d,e.name));
    }
  }
  await recur(dir);
  return out;
}

function checkFrontMatterAndH1(content, file){
  const lines = splitLines(content);
  let i=0;
  if (lines[i] !== '---') throw new Error('missing opening ---');
  i++;
  let marketOK=false, langOK=false, closed=false;
  for (; i<lines.length; i++){
    const line = lines[i];
    if (line === '---'){ closed=true; i++; break; }
    if (/^Market:\s*CA\s*$/.test(line)) marketOK=true;
    if (/^Language:\s*en-CA\s*$/.test(line)) langOK=true;
  }
  if(!closed) throw new Error('missing closing ---');
  while (i<lines.length && lines[i].trim()==='') i++;
  if (i>=lines.length || !/^#\s+/.test(lines[i])) throw new Error('missing H1 after front matter');
  if(!marketOK) throw new Error("front matter missing 'Market: CA'");
  if(!langOK) throw new Error("front matter missing 'Language: en-CA'");
}

async function main(){
  // 1) PR metadata (template o env PR_* si existieran)
  const tpl = await readIf(PR_TPL);
  const prMeta = tpl || `${process.env.PR_TITLE||''}\n${process.env.PR_BODY||''}`;
  if(!/^\s*Market:\s*CA\b/im.test(prMeta)) throw new Error("Missing 'Market: CA' in PR metadata/template");
  if(!/^\s*Language:\s*en-CA\b/im.test(prMeta)) throw new Error("Missing 'Language: en-CA' in PR metadata/template");

  // 2) SoT pages
  const files = await walk(NORTH_DIR);
  if(files.length===0) throw new Error(`No .md files under ${NORTH_DIR}`);
  const errors=[];
  for (const f of files){
    try {
      const c = await fs.readFile(f,'utf8');
      checkFrontMatterAndH1(c,f);
    } catch(e){
      errors.push(`${f}: ${e.message}`);
    }
  }
  if(errors.length){
    console.error('Invalid SoT headers:\n- ' + errors.join('\n- '));
    process.exit(1);
  }

  // 3) Redirects
  const r = await readIf(REDIRECTS);
  const need1='/README_AIDUX_NORTH /docs/north/threads/README';
  const need2='/README_AIDUX_NORTH.md /docs/north/threads/README.md';
  const has1 = r.split(/\r?\n/).some(l=>l.trim()===need1);
  const has2 = r.split(/\r?\n/).some(l=>l.trim()===need2);
  if(!has1 || !has2){
    const missing = [!has1 && need1, !has2 && need2].filter(Boolean).join(', ');
    throw new Error(`Missing redirects in ${REDIRECTS}: ${missing}`);
  }

  console.log('All preflight checks passed ✓');
}

main().catch(err=>{ console.error(err.message||String(err)); process.exit(1); });
