export function parseVertexResponse(input: unknown) {
  let text = '';
  if (typeof input === 'string') text = input;
  else if (input && typeof input === 'object') {
    const any = input as any;
    text =
      (typeof any.text === 'string' && any.text) ||
      (typeof any.result === 'string' && any.result) ||
      any?.vertexRaw?.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';
  }
  
  if (!text.trim()) {
    console.error('[Parser] No text received');
    return { success: false, data: null, error: 'Respuesta vacía' };
  }

  console.log('[Parser] Processing text length:', text.length);
  
  // Quitar markdown fences
  const cleaned = text.replace(/```json?|```/g, '').trim();

  try { 
    const parsed = JSON.parse(cleaned);
    console.log('[Parser] ✅ Success - fields:', Object.keys(parsed));
    return { success: true, data: parsed }; 
  } catch {
    // Intento de reparación mínima
    const repaired = cleaned
      .replace(/,(\s*[}\]])/g, '$1')  // quitar comas finales
      .replace(/(\w)(\s*\n\s*")/g, '$1,$2'); // añadir comas faltantes
      
    try { 
      const parsed = JSON.parse(repaired);
      console.log('[Parser] ✅ Repaired - fields:', Object.keys(parsed));
      return { success: true, data: parsed }; 
    } catch (e) { 
      console.error('[Parser] Failed:', e);
      return { success: false, data: null, error: 'JSON malformado' }; 
    }
  }
}

export default parseVertexResponse;
