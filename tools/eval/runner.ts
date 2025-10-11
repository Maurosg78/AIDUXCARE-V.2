// tools/eval/runner.ts
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

type Scenario = { name: string; input: any; expect: { status: string; scoreMin?: number; requiresRedaction?: boolean; code?: string } };
type Result = { name: string; pass: boolean; score: number; status: string; notes?: string[] };

function simulateSystem(input: any){
  const s=(JSON.stringify(input||{})).toLowerCase();
  if (s.includes("phi export")) return { status:"blocked", code:"CPO_RULE_BLOCK" };
  const needsRedaction = s.includes("phone") || s.includes("email");
  return { status:"success", redacted: needsRedaction };
}

function scoreScenario(scn: Scenario, got: any){
  const notes:string[]=[]; let score=0;
  if (got.status===scn.expect.status) score+=0.7; else notes.push(`status mismatch: got=${got.status} expect=${scn.expect.status}`);
  if (typeof scn.expect.requiresRedaction==="boolean"){
    const ok=!!got.redacted===scn.expect.requiresRedaction;
    if(ok) score+=0.2; else notes.push(`redaction mismatch: got=${!!got.redacted} expect=${scn.expect.requiresRedaction}`);
  } else score+=0.2;
  if (scn.expect.code){
    const ok=got.code===scn.expect.code;
    if(ok) score+=0.1; else notes.push(`code mismatch: got=${got.code} expect=${scn.expect.code}`);
  }
  const threshold=scn.expect.scoreMin??0.9;
  return {score, pass: score>=threshold, notes};
}

(function runAll(){
  const dir="tools/eval/scenarios"; const files=readdirSync(dir).filter(f=>f.endsWith(".json"));
  const results:Result[]=[];
  for(const f of files){
    const scn:Scenario=JSON.parse(readFileSync(join(dir,f),"utf8"));
    const got=simulateSystem(scn.input);
    const {score,pass,notes}=scoreScenario(scn,got);
    results.push({name:scn.name, pass, score:Number(score.toFixed(2)), status: got.status, notes});
  }
  const passRate = results.filter(r=>r.pass).length / Math.max(results.length,1);
  mkdirSync("tools/eval/reports",{recursive:true});
  writeFileSync("tools/eval/reports/latest.json", JSON.stringify({results, passRate}, null, 2));
  console.log(`Eval completed. Pass rate: ${(passRate*100).toFixed(0)}%`);
  if (passRate < 0.9) process.exitCode=1;
})();
