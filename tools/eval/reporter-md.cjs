const fs = require('node:fs');

const file = process.argv[2];
if(!file || !fs.existsSync(file)){
  console.error('JSONL file not found');
  process.exit(0);
}
const lines = fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const start = lines.find(l=>l.event==='eval-start');
const complete = lines.find(l=>l.event==='eval-complete');
const scenarios = lines.filter(l=>l.event==='scenario');

const pass = complete?.pass ?? scenarios.filter(s=>s.result==='pass').length;
const fail = complete?.fail ?? scenarios.filter(s=>s.result==='fail').length;

console.log(`# Eval Report`);
console.log(`**File:** \`${file}\``);
console.log(`**Total:** ${scenarios.length}  |  **Pass:** ${pass}  |  **Fail:** ${fail}`);
console.log(``);
for(const s of scenarios){
  const mark = s.result === 'pass' ? '✅' : '❌';
  console.log(`- ${mark} \`${s.file}\` — ${s.name || s.id}`);
}
