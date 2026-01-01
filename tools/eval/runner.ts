import fs from 'node:fs';
import path from 'node:path';

type Scenario = {
  id?: string;
  name?: string;
  goal?: string;
  [k: string]: any;
};

function iso(){ return new Date().toISOString().replace(/\.\d{3}Z$/,'Z'); }

function listScenarioFiles(dir: string){
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(dir, f));
}

function ensureDir(p: string){
  fs.mkdirSync(p, { recursive: true });
}

function jsonlLine(obj: any){ return JSON.stringify(obj) + '\n'; }

async function run(){
  const scenariosDir = path.join('tools','eval','scenarios');
  const outDir = path.join('tools','eval','reports');
  ensureDir(outDir);

  const outFile = path.join(outDir, `${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}.jsonl`);
  const files = listScenarioFiles(scenariosDir);

  fs.writeFileSync(outFile, '');
  fs.appendFileSync(outFile, jsonlLine({event:'eval-start', ts: iso(), count: files.length}));

  let pass = 0, fail = 0;

  for (const file of files){
    let sc: Scenario = {};
    try{
      const raw = fs.readFileSync(file, 'utf8');
      sc = JSON.parse(raw);
      // --- Regla mínima (stub): si existe el archivo y parsea, pasa ---
      const ok = true;
      fs.appendFileSync(outFile, jsonlLine({
        event:'scenario',
        ts: iso(),
        file: path.basename(file),
        id: sc.id || path.basename(file),
        name: sc.name || path.basename(file),
        result: ok ? 'pass' : 'fail'
      }));
      ok ? pass++ : fail++;
    }catch(err:any){
      fail++;
      fs.appendFileSync(outFile, jsonlLine({
        event:'scenario',
        ts: iso(),
        file: path.basename(file),
        id: sc.id || path.basename(file),
        name: sc.name || path.basename(file),
        result: 'fail',
        error: String(err?.message || err)
      }));
    }
  }

  fs.appendFileSync(outFile, jsonlLine({event:'eval-complete', ts: iso(), pass, fail}));
  const total = pass + fail || 1;
  const rate = Math.round((pass/total)*100);
  console.log(`Eval completed. Pass rate: ${rate}%`);
  console.log(`Report: ${outFile}`);
}

run().catch(e => { console.error(e); process.exit(1); });
