#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obtener el directorio actual con ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo TypeScript
const scriptPath = path.join(__dirname, 'createRealPatient.ts');
const outfile = path.join(__dirname, 'temp-script.mjs');

async function main() {
  try {
    // Transpilar el archivo TypeScript a JavaScript
    await esbuild.build({
      entryPoints: [scriptPath],
      bundle: true,
      platform: 'node',
      outfile,
      format: 'esm',
      target: 'node16',
    });

    console.log('Script transpilado correctamente, ejecutando...');

    // Ejecutar el archivo JavaScript generado
    const child = spawn('node', [outfile], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      // Limpiar el archivo temporal
      fs.unlinkSync(outfile);
      process.exit(code);
    });
  } catch (error) {
    console.error('Error al procesar el script:', error);
    process.exit(1);
  }
}

main(); 