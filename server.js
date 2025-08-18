const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5174;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Manejar la ruta de AI Light Demo
  if (req.url === '/ai-light-demo' || req.url === '/ai-light-demo/') {
    serveAILightDemo(res);
    return;
  }

  // Servir archivos estáticos
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = path.extname(filePath);
  let contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Archivo no encontrado, servir página de demo
        if (req.url.startsWith('/ai-light-demo')) {
          serveAILightDemo(res);
        } else {
          res.writeHead(404);
          res.end('File not found');
        }
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

function serveAILightDemo(res) {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Light + Offline Mode Demo</title>
    <link rel="stylesheet" href="/src/index.css" />
    <style>
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen py-8">
        <div class="max-w-4xl mx-auto px-4">
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">
                    🚀 AI Light + Offline Mode Demo
                </h1>
                <p class="text-gray-600 mb-6">
                    Página de demostración del módulo AI Light con funcionalidades offline y transcripción local.
                </p>

                <!-- Estado del módulo -->
                <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 class="font-semibold text-blue-800 mb-3">Estado del Módulo</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex items-center space-x-3">
                            <input type="checkbox" id="offlineMode" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                            <label for="offlineMode" class="text-sm font-medium text-gray-700">Modo Offline</label>
                        </div>
                        <div class="flex items-center space-x-3">
                            <input type="checkbox" id="aiLightLocalSTT" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                            <label for="aiLightLocalSTT" class="text-sm font-medium text-gray-700">STT Local</label>
                        </div>
                        <div class="flex items-center space-x-3">
                            <input type="checkbox" id="promoteToProOnReconnect" checked class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500">
                            <label for="promoteToProOnReconnect" class="text-sm font-medium text-gray-700">Auto-Promote</label>
                        </div>
                    </div>
                </div>

                <!-- Grabación de audio -->
                <div class="mb-6">
                    <button id="recordButton" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        Iniciar Grabación
                    </button>
                </div>

                <!-- Transcripción -->
                <div id="transcriptionSection" class="mb-6 hidden">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Transcripción Local</h3>
                    <div class="p-4 bg-gray-50 border rounded-lg">
                        <p id="transcriptionText" class="text-gray-700"></p>
                    </div>
                </div>

                <!-- Audio grabado -->
                <div id="audioSection" class="mb-6 hidden">
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Audio Grabado</h3>
                    <audio id="audioPlayer" controls class="w-full"></audio>
                </div>

                <!-- Información del módulo -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">Información del Módulo</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="font-medium text-gray-800 mb-2">Características</h3>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• Grabación de audio offline</li>
                                <li>• Transcripción local con WASM</li>
                                <li>• Almacenamiento cifrado en IndexedDB</li>
                                <li>• Background sync automático</li>
                                <li>• Promote to Pro automático/manual</li>
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-medium text-gray-800 mb-2">Estado Actual</h3>
                            <ul class="text-sm text-gray-600 space-y-1">
                                <li>• Modo Offline: <span id="offlineStatus">Desactivado</span></li>
                                <li>• STT Local: <span id="sttStatus">Desactivado</span></li>
                                <li>• Auto-Promote: <span id="promoteStatus">Activado</span></li>
                                <li>• Service Worker: <span id="swStatus">Verificando...</span></li>
                                <li>• WebAssembly: <span id="wasmStatus">Verificando...</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Funcionalidad básica de grabación
        let mediaRecorder = null;
        let audioChunks = [];
        let isRecording = false;

        const recordButton = document.getElementById('recordButton');
        const transcriptionSection = document.getElementById('transcriptionSection');
        const transcriptionText = document.getElementById('transcriptionText');
        const audioSection = document.getElementById('audioSection');
        const audioPlayer = document.getElementById('audioPlayer');

        // Verificar capacidades del navegador
        document.getElementById('swStatus').textContent = 'serviceWorker' in navigator ? 'Disponible' : 'No disponible';
        document.getElementById('wasmStatus').textContent = typeof WebAssembly !== 'undefined' ? 'Soportado' : 'No soportado';

        // Manejar toggles
        document.getElementById('offlineMode').addEventListener('change', function() {
            document.getElementById('offlineStatus').textContent = this.checked ? 'Activado' : 'Desactivado';
        });

        document.getElementById('aiLightLocalSTT').addEventListener('change', function() {
            document.getElementById('sttStatus').textContent = this.checked ? 'Activado' : 'Desactivado';
        });

        document.getElementById('promoteToProOnReconnect').addEventListener('change', function() {
            document.getElementById('promoteStatus').textContent = this.checked ? 'Activado' : 'Desactivado';
        });

        // Grabación de audio
        recordButton.addEventListener('click', async () => {
            if (!isRecording) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];

                    mediaRecorder.ondataavailable = (event) => {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        
                        audioPlayer.src = audioUrl;
                        audioSection.classList.remove('hidden');
                        
                        // Simular transcripción
                        transcriptionText.textContent = 'Transcripción simulada del audio grabado (confianza: 85%)';
                        transcriptionSection.classList.remove('hidden');
                        
                        // Detener todas las pistas
                        stream.getTracks().forEach(track => track.stop());
                    };

                    mediaRecorder.start();
                    isRecording = true;
                    recordButton.textContent = 'Detener Grabación';
                    recordButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                    recordButton.classList.add('bg-red-600', 'hover:bg-red-700');
                } catch (error) {
                    alert('Error al acceder al micrófono: ' + error.message);
                }
            } else {
                if (mediaRecorder) {
                    mediaRecorder.stop();
                    isRecording = false;
                    recordButton.textContent = 'Iniciar Grabación';
                    recordButton.classList.remove('bg-red-600', 'hover:bg-red-700');
                    recordButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
                }
            }
        });
    </script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

server.listen(PORT, () => {
  console.log(`🚀 Servidor AI Light Demo corriendo en http://localhost:${PORT}/ai-light-demo`);
  console.log(`📱 Presiona Ctrl+C para detener el servidor`);
});

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor...');
  server.close(() => {
    console.log('✅ Servidor detenido');
    process.exit(0);
  });
});
