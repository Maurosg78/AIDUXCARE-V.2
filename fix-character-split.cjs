const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix the processFindings function - it's treating strings as arrays
const processFindings = `// Procesar hallazgos clínicos de forma inteligente
  const processFindings = () => {
    const findings = [];
    
    // Handle physical_exam_findings
    if (vertexData.physical_exam_findings) {
      if (typeof vertexData.physical_exam_findings === 'string') {
        // If it's a string, split by sentences not characters!
        findings.push(...vertexData.physical_exam_findings.split('. ').filter(s => s.length > 2));
      } else if (typeof vertexData.physical_exam_findings === 'object' && !Array.isArray(vertexData.physical_exam_findings)) {
        Object.entries(vertexData.physical_exam_findings).forEach(([key, value]) => {
          if (value) findings.push(String(value));
        });
      }
    }
    
    return findings.slice(0, 10);
  };`;

// Replace the existing processFindings
if (content.includes('const processFindings')) {
  content = content.replace(/const processFindings[\s\S]*?return findings[\s\S]*?};/g, processFindings);
} else {
  // Add it before the return statement
  content = content.replace('return {', processFindings + '\n\n  return {');
}

fs.writeFileSync(file, content);
console.log('✅ Fixed character splitting bug');
