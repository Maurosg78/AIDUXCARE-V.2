const fs = require('fs');
const file = 'src/utils/cleanVertexResponse.ts';
let content = fs.readFileSync(file, 'utf8');

// Buscar y reemplazar la función formatRedFlag
const newFormatRedFlag = `function formatRedFlag(input: any): string {
  let text = "";
  
  if (typeof input === "string") {
    text = input;
  } else if (input && typeof input === "object" && input !== null) {
    const priority = mapPriority(input.priority || input.prioridad || "");
    const finding = String(input.finding || input.hallazgo || "");
    const rationale = String(input.rationale || input.justificacion || "");
    
    // Build clear text
    if (priority === "ER" || priority === "Urgent") {
      text = `🚨 [${priority}] ${finding}`;
    } else {
      text = `⚠️ [${priority}] ${finding}`;
    }
    
    if (rationale) {
      // Shorten rationale to key points
      const shortRationale = rationale.split('.')[0];
      text += ` - ${shortRationale}`;
    }
    
    return text;
  }
  
  // If still no text, return a default
  if (!text) return "⚠️ Clinical finding requiring attention";
  
  // Clean and limit
  text = text.replace(/^⚠️\s*/, "").trim();
  const words = text.split(/\s+/).slice(0, 20);
  
  // Add icon back
  if (text.includes("ER") || text.includes("Urgent")) {
    return `🚨 ${words.join(" ")}`;
  }
  return `⚠️ ${words.join(" ")}`;
}`;

// Replace the formatRedFlag function
const startIdx = content.indexOf('function formatRedFlag');
if (startIdx !== -1) {
  const endIdx = content.indexOf('\n}', startIdx) + 2;
  content = content.substring(0, startIdx) + newFormatRedFlag + content.substring(endIdx);
} else {
  // If function doesn't exist, add it after mapPriority
  const mapPriorityEnd = content.indexOf('function mapPriority');
  if (mapPriorityEnd !== -1) {
    const insertPoint = content.indexOf('\n}', mapPriorityEnd) + 2;
    content = content.substring(0, insertPoint) + '\n\n' + newFormatRedFlag + content.substring(insertPoint);
  }
}

// Also fix the test sensitivity/specificity to use real values
content = content.replace(
  'sensibilidad: typeof t === "object" && t.sensitivity ? t.sensitivity : 0.85',
  'sensibilidad: (typeof t === "object" && typeof t.sensitivity === "number") ? t.sensitivity : 0.85'
);

content = content.replace(
  'especificidad: typeof t === "object" && t.specificity ? t.specificity : 0.85',
  'especificidad: (typeof t === "object" && typeof t.specificity === "number") ? t.specificity : 0.85'
);

fs.writeFileSync(file, content);
console.log('✅ Fixed red flags and sensitivity/specificity');
