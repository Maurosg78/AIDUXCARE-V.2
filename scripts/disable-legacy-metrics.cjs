#!/usr/bin/env node
/**
 * Añade VITE_DISABLE_LEGACY_METRICS=true a .env.local
 * Desactiva metricsIngest (legacy); usa solo telemetry_sessions.
 * Uso: pnpm telemetry:disable-legacy
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const line = '\n# WO-METRICS-PILOT: legacy metrics disabled\nVITE_DISABLE_LEGACY_METRICS=true\n';

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, line.trimStart(), 'utf8');
  console.log('Creado .env.local con VITE_DISABLE_LEGACY_METRICS=true');
} else {
  const content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('VITE_DISABLE_LEGACY_METRICS')) {
    console.log('VITE_DISABLE_LEGACY_METRICS ya está en .env.local');
    process.exit(0);
    return;
  }
  fs.appendFileSync(envPath, line, 'utf8');
  console.log('Añadido VITE_DISABLE_LEGACY_METRICS=true a .env.local');
}

console.log('');
console.log('Reinicia el dev server (pnpm dev) para aplicar cambios.');
console.log('Los 400 de metricsIngest desaparecerán.');
