const functions = require('@google-cloud/functions-framework');
const speech = require('@google-cloud/speech');
const cors = require('cors');
const multer = require('multer');

// Configurar CORS para permitir requests desde el frontend
const corsOptions = {
  origin: [
    'http://localhost:5174',
    'http://localhost:5175', 
    'http://localhost:5176',
    'http://localhost:5177',
    'https://aiduxcare-v2.vercel.app'
  ],
  credentials: true
};

// Configurar multer para manejar archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Crear cliente de Speech-to-Text
const client = new speech.SpeechClient();

// Función para manejar CORS manualmente
const setCorsHeaders = (res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
};

// Función principal de transcripción
functions.http('transcribeAudio', async (req, res) => {
  // Manejar CORS
  setCorsHeaders(res);
  
  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    console.log('📥 Procesando solicitud de transcripción...');
    
    // Usar multer para procesar el archivo
    upload.single('audio')(req, res, async (err) => {
      if (err) {
        console.error('❌ Error procesando archivo:', err);
        res.status(400).json({ error: 'Error procesando archivo de audio' });
        return;
      }

      if (!req.file) {
        console.error('❌ No se encontró archivo de audio');
        res.status(400).json({ error: 'No se encontró archivo de audio' });
        return;
      }

      console.log(`📄 Archivo recibido: ${req.file.originalname}, tamaño: ${req.file.size} bytes`);

      // Configuración para Speech-to-Text
      const request = {
        audio: {
          content: req.file.buffer.toString('base64'),
        },
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'es-ES',
          alternativeLanguageCodes: ['es-MX', 'es-AR', 'es-CL'],
          model: 'medical_conversation',
          useEnhanced: true,
          enableSpeakerDiarization: true,
          diarizationSpeakerCount: 2,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          speechContexts: [{
            phrases: [
              'dolor', 'síntomas', 'tratamiento', 'diagnóstico', 'paciente', 'terapeuta',
              'fisioterapia', 'kinesiología', 'rehabilitación', 'ejercicio', 'movilidad',
              'hombro', 'rodilla', 'espalda', 'cuello', 'lumbar', 'cervical',
              'inflamación', 'contractura', 'tensión', 'rigidez', 'limitación'
            ],
            boost: 10
          }]
        },
      };

      console.log('🎙️ Enviando audio a Google Cloud Speech-to-Text...');
      
      // Realizar transcripción
      const [response] = await client.recognize(request);
      
      console.log('✅ Transcripción completada');
      
      // Procesar resultados
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      // Procesar speaker diarization si está disponible
      let speakers = [];
      if (response.results && response.results.length > 0) {
        response.results.forEach((result, index) => {
          if (result.alternatives && result.alternatives[0].words) {
            result.alternatives[0].words.forEach(word => {
              if (word.speakerTag !== undefined) {
                speakers.push({
                  word: word.word,
                  speakerTag: word.speakerTag,
                  startTime: word.startTime,
                  endTime: word.endTime
                });
              }
            });
          }
        });
      }

      // Formatear respuesta
      const result = {
        success: true,
        transcription: transcription,
        speakers: speakers,
        confidence: response.results.length > 0 ? response.results[0].alternatives[0].confidence : 0,
        timestamp: new Date().toISOString()
      };

      console.log('📤 Enviando respuesta:', { 
        transcriptionLength: transcription.length,
        speakersCount: speakers.length,
        confidence: result.confidence
      });

      res.status(200).json(result);
    });

  } catch (error) {
    console.error('❌ Error en transcripción:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Función de health check
functions.http('healthCheck', (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  res.status(200).json({ 
    status: 'healthy', 
    service: 'Google Cloud Speech-to-Text',
    timestamp: new Date().toISOString()
  });
}); 