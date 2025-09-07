// Agregar después de la línea 6 en responseParser.ts

// Función para intentar reparar JSON malformado
function tryRepairJSON(jsonString: string): string {
  try {
    // Intentar parsear tal cual
    JSON.parse(jsonString);
    return jsonString; // Si funciona, devolver sin cambios
  } catch (e) {
    console.log('[Parser] JSON malformado, intentando reparar...');
    
    // Fix 1: Agregar comas faltantes después de números antes de comillas
    let fixed = jsonString.replace(/(\d)(\s*\n\s*")/g, '$1,$2');
    
    // Fix 2: Agregar comas faltantes después de } antes de "
    fixed = fixed.replace(/}(\s*")/g, '},$1');
    
    // Fix 3: Agregar comas faltantes después de ] antes de "
    fixed = fixed.replace(/](\s*")/g, '],$1');
    
    // Fix 4: Agregar comas faltantes después de booleanos
    fixed = fixed.replace(/(true|false)(\s*")/g, '$1,$2');
    
    // Fix 5: Específico para el error que vimos (score: 0.00 sin coma)
    fixed = fixed.replace(/"score":\s*([\d.]+)(\s*")/g, '"score": $1,$2');
    
    return fixed;
  }
}
