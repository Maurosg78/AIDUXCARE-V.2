const functions = require('@google-cloud/functions-framework');
const speech = require('@google-cloud/speech');
const busboy = require('busboy');

// Crear cliente de Speech-to-Text
const client = new speech.SpeechClient();

// Función para manejar CORS manualmente
const setCorsHeaders = (res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
};

// Función para logging detallado
const logDetailed = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data })
  };
  console.log(`[${level}] ${timestamp}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Parser manual de FormData usando busboy
const parseFormData = (req) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    let fileBuffer = null;
    let fileInfo = {};

    bb.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    bb.on('file', (fieldname, file, info) => {
      logDetailed('INFO', 'Archivo detectado', {
        fieldname,
        filename: info.filename,
        encoding: info.encoding,
        mimeType: info.mimeType
      });

      fileInfo = {
        fieldname,
        originalname: info.filename,
        encoding: info.encoding,
        mimetype: info.mimeType
      };

      const chunks = [];
      
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
        fileInfo.size = fileBuffer.length;
        logDetailed('INFO', 'Archivo procesado completamente', {
          size: fileInfo.size,
          chunks: chunks.length
        });
      });
    });

    bb.on('finish', () => {
      if (fileBuffer) {
        resolve({
          file: {
            ...fileInfo,
            buffer: fileBuffer
          },
          fields
        });
      } else {
        reject(new Error('No se encontró archivo de audio'));
      }
    });

    bb.on('error', (err) => {
      logDetailed('ERROR', 'Error en busboy', { error: err.message });
      reject(err);
    });

    req.pipe(bb);
  });
};

// Función principal de transcripción
functions.http('transcribeAudio', async (req, res) => {
  // Manejar preflight CORS
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    logDetailed('INFO', 'CORS preflight request handled');
    res.status(200).send();
    return;
  }

  if (req.method !== 'POST') {
    logDetailed('ERROR', 'Method not allowed', { method: req.method });
    res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      allowedMethods: ['POST', 'OPTIONS']
    });
    return;
  }

  try {
    logDetailed('INFO', 'Iniciando procesamiento de transcripción', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      userAgent: req.headers['user-agent']
    });

    // Usar parseFormData para procesar el archivo
    const { file, fields } = await parseFormData(req);

    // Log detallado del archivo recibido
    logDetailed('INFO', 'Archivo de audio recibido exitosamente', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      encoding: file.encoding,
      fieldname: file.fieldname,
      bufferLength: file.buffer ? file.buffer.length : 0
    });

    // Validar formato de audio
    const supportedFormats = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac', 'audio/webm', 'audio/ogg', 'audio/mp4'];
    if (!supportedFormats.some(format => file.mimetype.includes(format.split('/')[1]))) {
      logDetailed('WARN', 'Formato de audio no reconocido, intentando procesar', {
        received: file.mimetype,
        supported: supportedFormats
      });
    }

    // Validar que el archivo no esté vacío o corrupto
    if (file.size === 0) {
      logDetailed('ERROR', 'Archivo de audio vacío');
      return res.status(400).json({
        success: false,
        error: 'Archivo de audio vacío',
        details: 'El archivo recibido no contiene datos'
      });
    }

    try {
      // Configuración para Google Cloud Speech-to-Text MEJORADA
      const audioConfig = {
        encoding: file.mimetype.includes('wav') ? 'LINEAR16' : 
                 file.mimetype.includes('webm') ? 'WEBM_OPUS' :
                 file.mimetype.includes('ogg') ? 'OGG_OPUS' :
                 file.mimetype.includes('mp3') ? 'MP3' :
                 file.mimetype.includes('mp4') ? 'MP3' : 'WEBM_OPUS', // Fallback más robusto
        sampleRateHertz: 48000,
        languageCode: 'es-ES',
        alternativeLanguageCodes: ['es-MX', 'es-AR', 'es-CL'],
        enableSpeakerDiarization: true,
        diarizationSpeakerCount: 2,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        model: 'medical_conversation',
        useEnhanced: true,
        // Optimizaciones de rendimiento
        enableWordConfidence: true,
        enableSeparateRecognitionPerChannel: false,
        maxAlternatives: 1, // Reducir alternativas para mejor rendimiento
        profanityFilter: false, // Desactivar filtro para mejor velocidad
        speechContexts: [{
          phrases: [
            // Frases médicas más frecuentes para mejor reconocimiento
            'dolor', 'síntomas', 'tratamiento', 'diagnóstico', 'paciente',
            'fisioterapia', 'kinesiología', 'rehabilitación', 'ejercicio',
            'hombro', 'rodilla', 'espalda', 'cuello', 'lumbar', 'cervical',
            'inflamación', 'contractura', 'tensión', 'rigidez'
          ],
          boost: 15 // Aumentar boost para mejor precisión
        }],
        metadata: {
          interactionType: 'DISCUSSION',
          industryNanosicCode: 621111, // Offices of physicians
          microphoneDistance: 'NEARFIELD',
          originalMediaType: 'AUDIO',
          recordingDeviceType: 'PC'
        }
      };

      logDetailed('INFO', 'Configuración de transcripción optimizada', {
        encoding: audioConfig.encoding,
        sampleRate: audioConfig.sampleRateHertz,
        language: audioConfig.languageCode,
        speakerDiarization: audioConfig.enableSpeakerDiarization,
        model: audioConfig.model,
        maxAlternatives: audioConfig.maxAlternatives
      });

      const request = {
        audio: {
          content: file.buffer.toString('base64'),
        },
        config: audioConfig,
      };

      logDetailed('INFO', 'Enviando solicitud optimizada a Google Cloud Speech-to-Text', {
        audioSizeBytes: file.buffer.length,
        base64Length: request.audio.content.length,
        timestamp: Date.now()
      });

      const startProcessing = Date.now();

      // Realizar transcripción con timeout optimizado
      const [response] = await Promise.race([
        client.recognize(request),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout de procesamiento (45s)')), 45000)
        )
      ]);
      
      const processingTime = Date.now() - startProcessing;
      
      logDetailed('INFO', 'Respuesta recibida de Google Cloud', {
        resultsCount: response.results?.length || 0,
        totalBilledTime: response.totalBilledTime,
        processingTimeMs: processingTime
      });

      if (!response.results || response.results.length === 0) {
        logDetailed('WARN', 'No se obtuvieron resultados de transcripción', {
          response: JSON.stringify(response, null, 2)
        });
        
        return res.json({
          success: false,
          message: 'No se pudo transcribir el audio. Intenta hablar más claro o cerca del micrófono.',
          details: 'No results from Google Cloud Speech-to-Text'
        });
      }

      // Procesar resultados
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');

      // Procesar información de hablantes
      let segments = [];
      let totalSpeakers = 0;

      if (response.results[0].alternatives[0].words) {
        const words = response.results[0].alternatives[0].words;
        const speakerTags = new Set();
        
        words.forEach(word => {
          if (word.speakerTag) {
            speakerTags.add(word.speakerTag);
          }
        });
        
        totalSpeakers = speakerTags.size;
        
        // Agrupar palabras por hablante
        let currentSpeaker = null;
        let currentText = '';
        
        words.forEach(word => {
          if (word.speakerTag !== currentSpeaker) {
            if (currentText.trim()) {
              segments.push({
                speaker: currentSpeaker,
                text: currentText.trim()
              });
            }
            currentSpeaker = word.speakerTag;
            currentText = word.word;
          } else {
            currentText += ' ' + word.word;
          }
        });
        
        // Agregar último segmento
        if (currentText.trim()) {
          segments.push({
            speaker: currentSpeaker,
            text: currentText.trim()
          });
        }
      }

      // Calcular confianza promedio
      const confidence = response.results.reduce((acc, result) => {
        return acc + (result.alternatives[0].confidence || 0);
      }, 0) / response.results.length;

      const result = {
        success: true,
        transcription,
        confidence,
        totalSpeakers,
        segments,
        metadata: {
          audioFormat: file.mimetype,
          audioSize: file.size,
          processingTime: Date.now(),
          language: audioConfig.languageCode
        }
      };

      logDetailed('SUCCESS', 'Transcripción completada exitosamente', {
        transcriptionLength: transcription.length,
        confidence: confidence,
        speakersDetected: totalSpeakers,
        segmentsCount: segments.length
      });

      res.json(result);

    } catch (speechError) {
      logDetailed('ERROR', 'Error en Google Cloud Speech-to-Text', {
        error: speechError.message,
        code: speechError.code,
        details: speechError.details,
        stack: speechError.stack
      });

      res.status(500).json({
        success: false,
        error: 'Error en el servicio de transcripción',
        details: speechError.message,
        code: speechError.code
      });
    }

  } catch (error) {
    logDetailed('ERROR', 'Error general en transcribeAudio', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Health check endpoint
functions.http('healthCheck', (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  logDetailed('INFO', 'Health check solicitado');
  
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Google Cloud Speech-to-Text',
    version: '2.0.0'
  });
}); 