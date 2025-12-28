const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
// Si hay argumentos después de los flags de vitest, agregar -- antes de ellos
// Esto permite que pnpm test:lowmem:file <archivo> funcione correctamente
const bin = require.resolve('vitest/vitest.mjs');

const result = spawnSync(process.execPath, [bin, ...args], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);

