import { execSync } from 'node:child_process';

const ports = [8080, 9099, 4400, 4000, 4500];

for (const port of ports) {
  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN -n`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();

    if (out) {
      const pids = out.split(/\s+/).join(' ');
      execSync(`kill -9 ${pids}`, { stdio: 'inherit' });
    }
  } catch {
    // sin procesos escuchando en ese puerto → nada que hacer
  }
}
