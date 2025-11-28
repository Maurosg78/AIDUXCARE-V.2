/**
 * TestGeolocation - Página de prueba para diagnosticar geolocalización
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState } from 'react';

import { geolocationService, GeolocationData } from '../services/geolocationService';

export const TestGeolocation: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<GeolocationData | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGeolocation = async () => {
    setIsTesting(true);
    setLogs([]);
    setResult(null);
    
    try {
      addLog('=== INICIANDO PRUEBA DE GEOLOCALIZACIÓN ===');
      
      // 1. Verificar soporte del navegador
      addLog('1. Verificando soporte del navegador...');
      const isSupported = geolocationService.isGeolocationSupported();
      addLog(`   Navegador soporta geolocalización: ${isSupported}`);
      
      if (!isSupported) {
        addLog('   ❌ Navegador no soporta geolocalización');
        return;
      }
      
      // 2. Verificar permisos
      addLog('2. Verificando permisos...');
      const permissionStatus = await geolocationService.checkGeolocationPermission();
      addLog(`   Estado de permisos: ${permissionStatus}`);
      
      // 3. Intentar detección
      addLog('3. Intentando detectar ubicación...');
      const location = await geolocationService.detectLocation();
      
      if (location) {
        addLog('   ✅ Ubicación detectada exitosamente');
        addLog(`   País: ${location.country}`);
        addLog(`   Código de país: ${location.countryCode}`);
        addLog(`   Región: ${location.region}`);
        addLog(`   Ciudad: ${location.city}`);
        addLog(`   Fuente: ${location.source}`);
        addLog(`   Timestamp: ${location.timestamp}`);
        setResult(location);
      } else {
        addLog('   ❌ No se pudo detectar ubicación');
      }
      
      // 4. Probar detección por IP
      addLog('4. Probando detección por IP...');
      try {
        const ipLocation = await geolocationService.detectLocationByIP();
        if (ipLocation) {
          addLog('   ✅ Ubicación por IP detectada');
          addLog(`   País: ${ipLocation.country}`);
          addLog(`   Código de país: ${ipLocation.countryCode}`);
          addLog(`   Región: ${ipLocation.region}`);
          addLog(`   Ciudad: ${ipLocation.city}`);
          addLog(`   IP: ${''}`);
        } else {
          addLog('   ❌ No se pudo detectar ubicación por IP');
        }
      } catch (ipError) {
        addLog(`   ❌ Error en detección por IP: ${ipError}`);
      }
      
      addLog('=== PRUEBA COMPLETADA ===');
      
    } catch (error) {
      addLog(`❌ Error general: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Prueba de geolocalización
          </h1>
          
          <div className="mb-6">
            <button
              onClick={testGeolocation}
              disabled={isTesting}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? 'Probando...' : 'Ejecutar Prueba Completa'}
            </button>
            
            <button
              onClick={clearLogs}
              className="ml-3 bg-gray-500 text-white px-4 py-3 rounded-md hover:bg-gray-600 transition-colors"
            >
              Limpiar Logs
            </button>
          </div>
          
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">✅ Resultado de la Detección</h3>
              <div className="text-sm text-green-700">
                <p><strong>País:</strong> {result.country}</p>
                <p><strong>Código:</strong> {result.countryCode}</p>
                <p><strong>Región:</strong> {result.region || 'No detectada'}</p>
                <p><strong>Ciudad:</strong> {result.city || 'No detectada'}</p>
                <p><strong>Fuente:</strong> {result.source}</p>
                <p><strong>Timestamp:</strong> {result.timestamp.toLocaleString()}</p>
              </div>
            </div>
          )}
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Logs de Prueba</span>
              <span className="text-gray-400 text-xs">{logs.length} mensajes</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No hay logs aún. Haz clic en &quot;Ejecutar Prueba Completa&quot; para comenzar.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
