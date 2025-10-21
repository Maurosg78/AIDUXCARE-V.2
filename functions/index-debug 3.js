exports.vertexAIProxy = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    console.log('Body recibido:', JSON.stringify(req.body));
    const { text, prompt } = req.body;
    
    if (!text) {
      console.log('No se recibió texto');
      return res.status(400).json({ error: 'Texto requerido' });
    }
    
    console.log('Texto a procesar:', text.substring(0, 100));
