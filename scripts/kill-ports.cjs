const { execSync } = require('node:child_process');
const ports = [8080, 9099, 4400, 4000, 4500];
for (const p of ports) {
  try { execSync(`lsof -tiTCP:${p} -sTCP:LISTEN -n | xargs -r kill -9`, { stdio: 'ignore' }); } catch {}
}
