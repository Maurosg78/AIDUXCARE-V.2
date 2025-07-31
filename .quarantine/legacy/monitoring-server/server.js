/**
 * 🔍 AiDuxCare - Remote Monitoring Server
 * Servidor para recibir y mostrar datos de monitoreo de la interfaz frontend
 * Permite al asistente ver en tiempo real el estado de la aplicación
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Almacenamiento en memoria (en producción usar Redis o base de datos)
const monitoringData = {
  sessions: new Map(),
  events: [],
  status: new Map(),
  lastUpdate: new Date()
};

// Limpiar datos antiguos cada 5 minutos
setInterval(() => {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  
  // Limpiar eventos antiguos
  monitoringData.events = monitoringData.events.filter(event => 
    new Date(event.timestamp).getTime() > fiveMinutesAgo
  );
  
  // Limpiar sesiones inactivas
  for (const [sessionId, session] of monitoringData.sessions) {
    if (new Date(session.lastActivity).getTime() < fiveMinutesAgo) {
      monitoringData.sessions.delete(sessionId);
      monitoringData.status.delete(sessionId);
    }
  }
  
  console.log(`🧹 Limpieza automática: ${monitoringData.events.length} eventos, ${monitoringData.sessions.size} sesiones activas`);
}, 5 * 60 * 1000);

// Endpoints de monitoreo

/**
 * Health check
 */
app.get('/api/monitoring/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    sessions: monitoringData.sessions.size,
    events: monitoringData.events.length
  });
});

/**
 * Recibir estado del sistema
 */
app.post('/api/monitoring/status', (req, res) => {
  try {
    const { sessionId, timestamp, ...status } = req.body;
    
    // Actualizar estado de la sesión
    monitoringData.status.set(sessionId, {
      ...status,
      timestamp,
      lastUpdate: new Date().toISOString()
    });
    
    // Actualizar sesión
    monitoringData.sessions.set(sessionId, {
      sessionId,
      startTime: monitoringData.sessions.get(sessionId)?.startTime || timestamp,
      lastActivity: timestamp,
      url: status.url,
      userAgent: status.userAgent
    });
    
    monitoringData.lastUpdate = new Date();
    
    console.log(`📊 Estado actualizado: ${sessionId} - ${status.ui?.currentPage || 'Unknown'}`);
    
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error procesando estado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Recibir evento individual
 */
app.post('/api/monitoring/events', (req, res) => {
  try {
    const event = req.body;
    
    // Validar evento
    if (!event.sessionId || !event.timestamp || !event.message) {
      return res.status(400).json({ error: 'Evento inválido' });
    }
    
    // Agregar a eventos
    monitoringData.events.unshift(event);
    
    // Mantener solo los últimos 1000 eventos
    if (monitoringData.events.length > 1000) {
      monitoringData.events = monitoringData.events.slice(0, 1000);
    }
    
    monitoringData.lastUpdate = new Date();
    
    // Log crítico si es error
    if (event.type === 'error') {
      console.error(`🚨 ERROR [${event.sessionId}]: ${event.message}`, event.details);
    } else if (event.type === 'warning') {
      console.warn(`⚠️ WARNING [${event.sessionId}]: ${event.message}`);
    } else {
      console.log(`ℹ️ INFO [${event.sessionId}]: ${event.message}`);
    }
    
    res.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('Error procesando evento:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Recibir lote de eventos
 */
app.post('/api/monitoring/events/batch', (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Formato de lote inválido' });
    }
    
    // Agregar eventos
    events.forEach(event => {
      if (event.sessionId && event.timestamp && event.message) {
        monitoringData.events.unshift(event);
      }
    });
    
    // Mantener solo los últimos 1000 eventos
    if (monitoringData.events.length > 1000) {
      monitoringData.events = monitoringData.events.slice(0, 1000);
    }
    
    monitoringData.lastUpdate = new Date();
    
    console.log(`📦 Lote recibido: ${events.length} eventos`);
    
    res.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('Error procesando lote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Limpiar eventos acumulados
 */
app.post('/api/monitoring/clear', (req, res) => {
  try {
    const { clear } = req.body;
    
    if (clear === 'all') {
      monitoringData.events = [];
      monitoringData.sessions.clear();
      monitoringData.status.clear();
      monitoringData.lastUpdate = new Date();
      
      console.log('🧹 Todos los eventos y sesiones han sido limpiados');
      
      res.json({ 
        success: true, 
        message: 'Todos los datos de monitoreo han sido limpiados',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: 'Parámetro "clear" debe ser "all"' });
    }
  } catch (error) {
    console.error('Error limpiando datos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtener datos de monitoreo para el dashboard
 */
app.get('/api/monitoring/data', (req, res) => {
  try {
    const { sessionId, limit = 50 } = req.query;
    
    let events = monitoringData.events;
    
    // Filtrar por sesión si se especifica
    if (sessionId) {
      events = events.filter(event => event.sessionId === sessionId);
    }
    
    // Limitar cantidad
    events = events.slice(0, parseInt(limit));
    
    // Obtener estados de sesiones
    const sessions = Array.from(monitoringData.sessions.values());
    const statuses = Array.from(monitoringData.status.values());
    
    res.json({
      events,
      sessions,
      statuses,
      summary: {
        totalEvents: monitoringData.events.length,
        activeSessions: monitoringData.sessions.size,
        lastUpdate: monitoringData.lastUpdate,
        errors: monitoringData.events.filter(e => e.type === 'error').length,
        warnings: monitoringData.events.filter(e => e.type === 'warning').length
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtener eventos por categoría
 */
app.get('/api/monitoring/events/:category', (req, res) => {
  try {
    const { category } = req.params;
    const { sessionId, limit = 20 } = req.query;
    
    let events = monitoringData.events.filter(event => event.category === category);
    
    if (sessionId) {
      events = events.filter(event => event.sessionId === sessionId);
    }
    
    events = events.slice(0, parseInt(limit));
    
    res.json({ events, category });
  } catch (error) {
    console.error('Error obteniendo eventos por categoría:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Dashboard web
 */
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

/**
 * API para obtener datos del dashboard
 */
app.get('/api/dashboard', (req, res) => {
  try {
    const sessions = Array.from(monitoringData.sessions.values());
    const statuses = Array.from(monitoringData.status.values());
    
    // Estadísticas por categoría
    const categoryStats = {};
    monitoringData.events.forEach(event => {
      if (!categoryStats[event.category]) {
        categoryStats[event.category] = { total: 0, errors: 0, warnings: 0 };
      }
      categoryStats[event.category].total++;
      if (event.type === 'error') categoryStats[event.category].errors++;
      if (event.type === 'warning') categoryStats[event.category].warnings++;
    });
    
    // Últimos eventos críticos
    const criticalEvents = monitoringData.events
      .filter(e => e.type === 'error' || (e.details?.critical))
      .slice(0, 10);
    
    res.json({
      sessions,
      statuses,
      categoryStats,
      criticalEvents,
      summary: {
        totalEvents: monitoringData.events.length,
        activeSessions: sessions.length,
        lastUpdate: monitoringData.lastUpdate,
        errors: monitoringData.events.filter(e => e.type === 'error').length,
        warnings: monitoringData.events.filter(e => e.type === 'warning').length
      }
    });
  } catch (error) {
    console.error('Error obteniendo datos del dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Servir archivos estáticos del dashboard
app.use('/static', express.static(path.join(__dirname, 'public')));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🔍 Servidor de monitoreo remoto iniciado en puerto ${PORT}`);
  console.log(`📊 Dashboard disponible en: http://localhost:${PORT}/dashboard`);
  console.log(`🔗 API disponible en: http://localhost:${PORT}/api/monitoring`);
});

module.exports = app; 