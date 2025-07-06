const speech = require('@google-cloud/speech');
const functions = require('@google-cloud/functions-framework');
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

// Configurar multer para manejar archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB límite
  }
});

// Inicializar cliente de Speech-to-Text
const speechClient = new speech.SpeechClient();

// Función principal de transcripción
functions.http('transcribeAudio', cors(corsOptions), async (req, res) => {
  console.log('🎙️ Iniciando transcripción de audio médico...');
  
  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Método no permitido. Use POST.' 
      });
    }

    // Manejar upload de archivo
    upload.single('audio')(req, res, async (err) => {
      if (err) {
        console.error('Error en upload:', err);
        return res.status(400).json({ 
          error: 'Error al procesar archivo de audio' 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: 'No se encontró archivo de audio' 
        });
      }

      console.log(`📁 Archivo recibido: ${req.file.originalname}, tamaño: ${req.file.size} bytes`);

      try {
        // Configuración para transcripción médica en español
        const request = {
          audio: {
            content: req.file.buffer.toString('base64'),
          },
          config: {
            encoding: 'WEBM_OPUS', // Formato común de navegadores
            sampleRateHertz: 48000,
            languageCode: 'es-ES',
            alternativeLanguageCodes: ['es-MX', 'es-AR', 'es-CO'],
            // Configuración específica para contexto médico
            speechContexts: [{
              phrases: [
                'dolor', 'síntoma', 'diagnóstico', 'tratamiento', 'medicamento',
                'paciente', 'consulta', 'examen', 'análisis', 'terapia',
                'fisioterapia', 'kinesiología', 'rehabilitación', 'lesión',
                'inflamación', 'contractura', 'articulación', 'músculo',
                'cervical', 'lumbar', 'hombro', 'rodilla', 'tobillo'
              ]
            }],
            // Mejorar precisión para audio médico
            useEnhanced: true,
            model: 'medical_conversation',
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: true,
            // Configuración para múltiples hablantes
            diarizationConfig: {
              enableSpeakerDiarization: true,
              minSpeakerCount: 2,
              maxSpeakerCount: 3
            }
          },
        };

        console.log('🔄 Enviando audio a Google Cloud Speech-to-Text...');
        
        // Realizar transcripción
        const [response] = await speechClient.recognize(request);
        
        if (!response.results || response.results.length === 0) {
          return res.status(200).json({
            success: true,
            transcription: '',
            message: 'No se detectó habla en el audio',
            speakers: []
          });
        }

        // Procesar resultados con información de hablantes
        const transcriptionSegments = [];
        let fullTranscription = '';

        response.results.forEach((result, index) => {
          const alternative = result.alternatives[0];
          const words = alternative.words || [];
          
          // Detectar cambios de hablante
          let currentSpeaker = null;
          let currentSegment = '';
          
          words.forEach((word) => {
            if (word.speakerTag !== currentSpeaker) {
              if (currentSegment) {
                transcriptionSegments.push({
                  speaker: currentSpeaker,
                  text: currentSegment.trim(),
                  confidence: alternative.confidence
                });
              }
              currentSpeaker = word.speakerTag;
              currentSegment = word.word;
            } else {
              currentSegment += ' ' + word.word;
            }
          });

          // Añadir último segmento
          if (currentSegment) {
            transcriptionSegments.push({
              speaker: currentSpeaker,
              text: currentSegment.trim(),
              confidence: alternative.confidence
            });
          }

          fullTranscription += alternative.transcript + ' ';
        });

        console.log('✅ Transcripción completada exitosamente');
        console.log(`📝 Texto transcrito: ${fullTranscription.substring(0, 100)}...`);

        // Respuesta exitosa
        res.status(200).json({
          success: true,
          transcription: fullTranscription.trim(),
          segments: transcriptionSegments,
          speakers: [...new Set(transcriptionSegments.map(s => s.speaker))],
          totalSpeakers: transcriptionSegments.length > 0 ? 
            Math.max(...transcriptionSegments.map(s => s.speaker || 1)) : 1,
          confidence: response.results[0]?.alternatives[0]?.confidence || 0,
          processingTime: Date.now(),
          audioInfo: {
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
          }
        });

      } catch (transcriptionError) {
        console.error('❌ Error en transcripción:', transcriptionError);
        res.status(500).json({
          success: false,
          error: 'Error al transcribir audio',
          details: transcriptionError.message
        });
      }
    });

  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Función de health check
functions.http('healthCheck', cors(corsOptions), (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'AiDuxCare Speech-to-Text',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}); 