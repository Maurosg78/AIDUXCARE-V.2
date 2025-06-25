import { useState, useEffect } from 'react';
import supabase from '@/core/auth/supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';

interface ErrorWithMessage {
  message?: string;
  hint?: string;
}

// Componente simplificado para comprobar la conexión a Supabase
export const ConnectionStatus = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);

  useEffect(() => {
    // Función para comprobar la conexión con varios métodos
    const checkConnection = async () => {
      console.log('Iniciando diagnóstico de conexión a Supabase...');
      
      try {
        // 1. Primero intentar con el cliente Singleton oficial
        console.log('MÉTODO 1: Probando conexión con cliente Singleton...');
        const singletonTest = await supabase.from('patients').select('id').limit(1);
        
        if (!singletonTest.error) {
          setStatus('connected');
          setErrorInfo(null);
          setDetails('SUCCESS: Conexión exitosa con cliente Singleton');
          console.log('SUCCESS: Cliente Singleton funcionando');
          return;
        } 
        
        console.log('ERROR: Cliente Singleton falló:', singletonTest.error);
        
        // 2. Si falló el método directo, intentar con el cliente oficial
        console.log('MÉTODO 2: Probando con el cliente oficial de Supabase...');
        const client = supabase as SupabaseClient;
        if (!client) {
          throw new Error('Cliente Supabase no disponible');
        }
        
        // Lista de tablas para probar
        const tablesToTry = ['health_check', 'contextual_memory', 'persistent_memory'];
        let successfulTable = null;
        let lastError: ErrorWithMessage | null = null;
        
        // Probar cada tabla
        for (const table of tablesToTry) {
          try {
            console.log(`Probando tabla ${table} con cliente oficial...`);
            const { data, error } = await client
              .from(table)
              .select('*')
              .limit(1);
              
            if (error) {
              console.error(`Error en tabla ${table}:`, error);
              lastError = error;
            } else {
              console.log(`SUCCESS: Conexión exitosa con tabla ${table}`);
              successfulTable = table;
              break;
            }
          } catch (err) {
            console.error(`Error inesperado en tabla ${table}:`, err);
            lastError = err as ErrorWithMessage;
          }
        }
        
        // Evaluar resultados del segundo método
        if (successfulTable) {
          setStatus('connected');
          setErrorInfo(null);
          setDetails(`Conexión establecida con cliente oficial a través de tabla: ${successfulTable}`);
        } else {
          // Si ambos métodos fallaron, mostrar error
          setStatus('error');
          
          if (singletonTest.error) {
            const singletonError = singletonTest.error as ErrorWithMessage;
            const message = singletonError.message || 'Error desconocido';
            const hint = singletonError.hint || '';
            setErrorInfo(`${message}${hint ? ` (${hint})` : ''}`);
          } else if (lastError) {
            const message = lastError.message || 'Error desconocido';
            setErrorInfo(message);
          } else {
            setErrorInfo('No se pudo conectar a Supabase por ningún método');
          }
          
          // Detalles técnicos completos
          setDetails(JSON.stringify({ 
            singletonMethod: singletonTest, 
            clientMethod: { error: lastError } 
          }, null, 2));
        }
      } catch (err) {
        console.error('Error general al verificar conexión:', err);
        setStatus('error');
        setErrorInfo(err instanceof Error ? err.message : 'Error desconocido');
      }
    };
    
    // Ejecutar verificación
    checkConnection();
    
  }, []);
  
  return (
    <div className="connection-status p-4 border rounded">
      <h2 className="text-lg font-bold mb-2">Estado de conexión a Supabase</h2>
      
      {status === 'checking' && (
        <div className="checking">
          <p className="text-blue-600">⌛ Comprobando conexión con Supabase...</p>
        </div>
      )}
      
      {status === 'connected' && (
        <div className="connected">
          <p className="text-green-600">SUCCESS: Conexión a Supabase activa</p>
          {details && <p className="text-sm text-gray-600">{details}</p>}
        </div>
      )}
      
      {status === 'error' && (
        <div className="error">
          <p className="text-red-600">ERROR: Error en la conexión a Supabase</p>
          {errorInfo && <p className="text-sm text-red-500">{errorInfo}</p>}
          
          <div className="mt-4 bg-gray-100 p-3 rounded text-xs">
            <p className="font-medium text-gray-700">Posibles soluciones:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Verificar que la API key en el proyecto sea correcta y esté activa</li>
              <li>Comprobar que no hay problemas de CORS en la configuración de Supabase</li>
              <li>Intentar generar una nueva API key en el panel de control de Supabase</li>
            </ul>
          </div>
          
          {details && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-blue-500">Ver detalles técnicos</summary>
              <pre className="text-xs bg-gray-100 p-2 mt-1 overflow-auto max-h-40">{details}</pre>
            </details>
          )}
          
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus; 