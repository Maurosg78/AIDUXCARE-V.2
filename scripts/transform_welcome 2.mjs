#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const [,, srcPath, outPath] = process.argv;
if (!srcPath || !outPath) {
  console.error('Usage: node scripts/transform_welcome.mjs <src> <out>');
  process.exit(1);
}

let code = fs.readFileSync(srcPath, 'utf8');

// 1) any -> unknown (conservador)
code = code.replace(/:\s*any\b/g, ': unknown');
code = code.replace(/\bas\s+any\b/g, 'as unknown');

// 2) Bloquear imports directos a core/firebase → alias controlado
code = code.replace(/(['"])@\/core\/firebase\/firebaseClient\1/g, '"@/integrations/firebase"');
code = code.replace(/(['"])src\/core\/firebase\/firebaseClient\1/g, '"@/integrations/firebase"');

// 3) Corregir ruta del logo hacia alias estable
code = code.replace(/(['"])\.{1,3}\/assets\/logo\/aiduxcare-logo\.svg\1/g, '"@/assets/logo/aiduxcare-logo.svg"');

// 4) Alinear export default
let hasDefaultExport = /export\s+default\s+/.test(code);
if (!hasDefaultExport) {
  // export const WelcomePage → const WelcomePage
  code = code.replace(/export\s+const\s+WelcomePage\b/g, 'const WelcomePage');
  // export function WelcomePage → function WelcomePage
  code = code.replace(/export\s+function\s+WelcomePage\b/g, 'function WelcomePage');
  // Asegurar export default al final si no existe
  if (!/export\s+default\s+WelcomePage\b/.test(code)) {
    code = code.replace(/\n*$/,'');
    code += '\n\nexport default WelcomePage;\n';
  }
}

// 5) Asegurar import de useNavigate si se usa y falta
if (/useNavigate\b/.test(code) && !/from\s+['"]react-router-dom['"]/.test(code)) {
  code = `import { useNavigate } from "react-router-dom";\n` + code;
}

// 6) Normalizar saltos de línea
code = code.replace(/\r\n?/g, '\n');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, code, 'utf8');
console.log(`Transformed → ${outPath}`);
