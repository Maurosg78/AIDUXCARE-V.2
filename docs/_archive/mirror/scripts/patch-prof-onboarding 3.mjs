import fs from 'node:fs';

const file = 'src/pages/ProfessionalOnboardingPage.tsx';
const src = fs.readFileSync(file, 'utf8');

// Regex: localiza cualquier useEffect(() => { ... }, [])
const re = /useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[\s*\]\s*\);/m;

const replacement = `useEffect(() => {
  (async () => {
    try {
      const config = await geolocationService.getComplianceConfig();
      setComplianceConfig(config as ComplianceConfig);
      console.log("📋 Regulaciones relevantes:", (config as ComplianceConfig).regulations.map((r: Regulation) => r.name));
    } catch (error) {
      console.error("Error cargando configuración de cumplimiento:", error);
    }
  })();
}, []);`;

if (!re.test(src)) {
  console.error('⚠️ No se encontró el bloque useEffect esperado. No se hicieron cambios.');
  process.exit(1);
}

const out = src.replace(re, replacement);
fs.writeFileSync(file, out, 'utf8');
console.log('✅ patch aplicado a', file);
