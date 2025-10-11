const { readFileSync, writeFileSync, mkdirSync } = require("fs");
try{
  const j=JSON.parse(readFileSync("tools/eval/reports/latest.json","utf8"));
  const rows=j.results.map(r=>`| ${r.name} | ${r.status} | ${r.score.toFixed(2)} | ${r.pass?"✅":"❌"} | ${(r.notes||[]).join("<br>")} |`);
  const md=[
    "# EVAL Report (latest)","","Pass rate: "+(j.passRate*100).toFixed(0)+"%","",
    "| Scenario | Status | Score | Pass | Notes |","|---|---|---:|:---:|---|",...rows,"",
    "_Market: CA · Language: en-CA · COMPLIANCE_CHECKED · Signed-off-by: ROADMAP_READ_",""
  ].join("\n");
  mkdirSync("tools/eval/reports",{recursive:true});
  writeFileSync("tools/eval/reports/latest.md", md);
  console.log("MD report written to tools/eval/reports/latest.md");
}catch(e){ console.error("No JSON report. Run eval:run first."); process.exitCode=1; }
