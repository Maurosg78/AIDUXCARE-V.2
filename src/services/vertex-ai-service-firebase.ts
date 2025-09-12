const ANALYZE_BASE = (import.meta && import.meta.env && import.meta.env.DEV)
  ? '/api'
  : 'https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net';
const ANALYZE_URL = ANALYZE_BASE + '/vertexAIProxy';

export async function callVertexAI(prompt: string): Promise<{ 
  text: string; 
  vertexRaw?: any; 
  model?: string; 
  location?: string;
}> {
  const endpoint = ANALYZE_URL;
  
  // Log para debug
  console.log('[Vertex] Calling:', endpoint);
  console.log('[Vertex] Prompt preview (first 500 chars):', prompt.substring(0, 500));
  console.log('[Vertex] Prompt length:', prompt.length);
  
  try {
    const requestBody = { 
      prompt, 
      timestamp: Date.now()
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Vertex] HTTP Error:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const res = await response.json();
    console.log('[Vertex] Response received:', {
      ok: res.ok,
      model: res.model,
      textLength: res.text?.length,
      hasVertexRaw: !!res.vertexRaw
    });
    
    // La Cloud Function devuelve la estructura correctamente
    const text = res.text || '';
    
    // Verificar si el texto es solo "{}" o está vacío
    if (!text || text.trim() === '{}' || text.trim().length < 10) {
      console.error('[Vertex] Empty or minimal response received');
      console.log('[Vertex] Full response:', JSON.stringify(res).substring(0, 1000));
      
      // Intentar usar el contenido raw de Vertex si existe
      const rawText = res.vertexRaw?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText && rawText !== '{}') {
        console.log('[Vertex] Using raw text from vertexRaw');
        return {
          text: rawText,
          vertexRaw: res.vertexRaw,
          model: res.model || 'gemini-2.5-flash',
          location: res.location || 'us-central1'
        };
      }
      
      throw new Error('VertexAI returned empty response - check prompt format');
    }
    
    console.log('[Vertex] Success - text length:', text.length);
    
    return { 
      text, 
      vertexRaw: res.vertexRaw,
      model: res.model || 'gemini-2.5-flash',
      location: res.location || 'us-central1'
    };
    
  } catch (error) {
    console.error('[Vertex] Error:', error);
    throw error;
  }
}

export default callVertexAI;
