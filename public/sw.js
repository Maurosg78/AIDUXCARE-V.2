// Service Worker para AiDuxCare - AI Light + Offline Mode
const CACHE_NAME = 'aiduxcare-sw-v1';
const OFFLINE_CACHE = 'aiduxcare-offline-v1';

// Eventos principales
self.addEventListener('install', (event) => {
  console.log('SW: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Cache abierto');
        return cache.addAll([
          '/',
          '/offline.html',
          '/static/js/bundle.js',
          '/static/css/main.css'
        ]);
      })
      .catch((error) => {
        console.error('SW: Error en instalación:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('SW: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requests para cache offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar cache si existe
        if (response) {
          return response;
        }

        // Intentar fetch de red
        return fetch(event.request)
          .then((response) => {
            // Cachear respuesta exitosa
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback offline
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            return new Response('Offline - No disponible', { status: 503 });
          });
      })
  );
});

// Background Sync para transcripciones locales
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync iniciado:', event.tag);
  
  if (event.tag === 'upload-transcriptions') {
    event.waitUntil(uploadPendingTranscriptions());
  }
});

// Función para subir transcripciones pendientes
async function uploadPendingTranscriptions() {
  try {
    console.log('SW: Iniciando upload de transcripciones pendientes...');
    
    // Obtener transcripciones del IndexedDB
    const transcriptions = await getPendingTranscriptionsFromIndexedDB();
    
    if (transcriptions.length === 0) {
      console.log('SW: No hay transcripciones pendientes');
      return;
    }

    console.log(`SW: ${transcriptions.length} transcripciones pendientes encontradas`);

    // Procesar cada transcripción
    for (const transcription of transcriptions) {
      try {
        await uploadTranscriptionToServer(transcription);
        await removeTranscriptionFromIndexedDB(transcription.id);
        console.log(`SW: Transcripción ${transcription.id} subida exitosamente`);
      } catch (error) {
        console.error(`SW: Error subiendo transcripción ${transcription.id}:`, error);
        // Incrementar contador de reintentos
        await incrementRetryCount(transcription.id);
      }
    }

    console.log('SW: Upload de transcripciones completado');
    
  } catch (error) {
    console.error('SW: Error en background sync:', error);
  }
}

// Funciones de IndexedDB
async function getPendingTranscriptionsFromIndexedDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('aiduxcare-offline', 1);
    
    request.onerror = () => {
      console.error('SW: Error abriendo IndexedDB');
      resolve([]);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['transcriptions'], 'readonly');
      const store = transaction.objectStore('transcriptions');
      const query = store.getAll();
      
      query.onsuccess = () => {
        resolve(query.result || []);
      };
      
      query.onerror = () => {
        console.error('SW: Error consultando IndexedDB');
        resolve([]);
      };
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('transcriptions')) {
        db.createObjectStore('transcriptions', { keyPath: 'id' });
      }
    };
  });
}

async function removeTranscriptionFromIndexedDB(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('aiduxcare-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['transcriptions'], 'readwrite');
      const store = transaction.objectStore('transcriptions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
    };
  });
}

async function incrementRetryCount(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('aiduxcare-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['transcriptions'], 'readwrite');
      const store = transaction.objectStore('transcriptions');
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const transcription = getRequest.result;
        if (transcription && transcription.retryCount < 3) {
          transcription.retryCount++;
          store.put(transcription);
        }
        resolve();
      };
    };
  });
}

// Función para subir transcripción al servidor
async function uploadTranscriptionToServer(transcription) {
  const endpoint = '/api/transcriptions/local';
  
  const payload = {
    id: transcription.id,
    text: transcription.text,
    confidence: transcription.confidence,
    timestamp: transcription.timestamp,
    userId: transcription.userId,
    sessionId: transcription.sessionId,
    metadata: transcription.metadata
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Función para obtener token de autenticación
async function getAuthToken() {
  // En implementación real, obtener token del cache o localStorage
  // Por ahora, placeholder
  return 'placeholder-token';
}

// Mensajes del cliente
self.addEventListener('message', (event) => {
  console.log('SW: Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' });
  }
});

console.log('SW: Service Worker cargado y funcionando');
