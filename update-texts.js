const fs = require('fs');

// Leer archivo ClinicalAnalysisResults
let content = fs.readFileSync('src/components/ClinicalAnalysisResults.tsx', 'utf8');
content = content.replace(/>Alertas Médico-Legales</g, '>{t("Alertas Médico-Legales")}<');
content = content.replace(/>Hallazgos Clínicos</g, '>{t("Hallazgos Clínicos")}<');
fs.writeFileSync('src/components/ClinicalAnalysisResults.tsx', content);

// Leer archivo WorkflowAnalysisTab
let content2 = fs.readFileSync('src/components/WorkflowAnalysisTab.tsx', 'utf8');
content2 = content2.replace(/>Limpiar</g, '>{t("Limpiar")}<');
fs.writeFileSync('src/components/WorkflowAnalysisTab.tsx', content2);

console.log('Textos actualizados');
