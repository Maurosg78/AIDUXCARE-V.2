/**
 * 🔍 AUTH DEBUG PAGE - DIAGNÓSTICO DEL SISTEMA DE AUTENTICACIÓN
 * Página para diagnosticar problemas en el sistema de autenticación
 */

import React, { useState, useEffect } from 'react';
import MedicalEncryptionService from '@/security/MedicalEncryptionService';
import { useAuth } from '@/contexts/AuthContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'PHYSICIAN' | 'NURSE';
  specialization: string;
  password: string;
  isTemporary: boolean;
  expiresAt?: string;
  createdAt: string;
}

const AuthDebugPage: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [testEmail, setTestEmail] = useState('msobarzo78@gmail.com');
  const [testPassword, setTestPassword] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const stored = localStorage.getItem('aiduxcare_registered_users');
      const parsedUsers = stored ? JSON.parse(stored) : [];
      setUsers(parsedUsers);
      addDebugInfo(`STATS: Cargados ${parsedUsers.length} usuarios del localStorage`);
    } catch (error) {
      addDebugInfo(`ERROR: Error cargando usuarios: ${error}`);
    }
  };

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testPasswordHash = () => {
    if (!testPassword) {
      addDebugInfo('ERROR: Ingresa una contraseña para probar');
      return;
    }

    const hash = MedicalEncryptionService.hashPassword(testPassword);
    addDebugInfo(`🔐 Hash generado para "${testPassword}": ${hash}`);

    const verification = MedicalEncryptionService.verifyPassword(testPassword, hash);
    addDebugInfo(`SUCCESS: Verificación del hash: ${verification ? 'CORRECTA' : 'INCORRECTA'}`);
  };

  const testUserLogin = () => {
    const user = users.find(u => u.email.toLowerCase() === testEmail.toLowerCase());
    
    if (!user) {
      addDebugInfo(`ERROR: Usuario no encontrado: ${testEmail}`);
      return;
    }

    addDebugInfo(`USER: Usuario encontrado: ${user.name} (${user.email})`);
    addDebugInfo(`🔒 Rol: ${user.role}, Temporal: ${user.isTemporary}`);
    
    if (testPassword) {
      const verification = MedicalEncryptionService.verifyPassword(testPassword, user.password);
      addDebugInfo(`🔐 Verificación contraseña: ${verification ? 'CORRECTA' : 'INCORRECTA'}`);
      addDebugInfo(`📝 Hash almacenado: ${user.password}`);
    }
  };

  const clearAllData = () => {
    localStorage.removeItem('aiduxcare_registered_users');
    localStorage.removeItem('aiduxcare_password_resets');
    setUsers([]);
    addDebugInfo('🧹 Todos los datos han sido limpiados');
    loadUsers();
  };

  const createTestUser = () => {
    const testUser: UserData = {
      id: `user-${Date.now()}`,
      name: 'Mauricio Sobarzo',
      email: 'msobarzo78@gmail.com',
      role: 'OWNER',
      specialization: 'Administración',
      password: MedicalEncryptionService.hashPassword('test123'),
      isTemporary: false,
      createdAt: new Date().toISOString()
    };

    const existingUsers = users.filter(u => u.email !== testUser.email);
    const newUsers = [...existingUsers, testUser];
    
    localStorage.setItem('aiduxcare_registered_users', JSON.stringify(newUsers));
    setUsers(newUsers);
    addDebugInfo(`SUCCESS: Usuario de prueba creado: ${testUser.email} / password: test123`);
  };

  const clearUserData = () => {
    try {
      // Limpiar datos de autenticación
      localStorage.removeItem('aiduxcare_v2_therapist_data');
      localStorage.removeItem('aiduxcare_v2_sessions');
      localStorage.removeItem('aiduxcare_v2_patients');
      
      // Limpiar también posibles datos mezclados de otras versiones
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('aiduxcare') || key.includes('xime') || key.includes('patient'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      addDebugInfo('SUCCESS: Todos los datos de usuario limpiados exitosamente');
      addDebugInfo('RELOAD: Recarga la página para empezar limpio');
      
      // Recargar usuarios después de limpiar
      setTimeout(loadUsers, 500);
    } catch (error) {
      addDebugInfo(`ERROR: Error limpiando datos: ${error}`);
    }
  };

  const clearPatientData = () => {
    try {
      // Limpiar solo datos de pacientes (no autenticación)
      localStorage.removeItem('aiduxcare_v2_patients');
      localStorage.removeItem('aiduxcare_v2_sessions');
      
      addDebugInfo('SUCCESS: Datos de pacientes limpiados');
    } catch (error) {
      addDebugInfo(`ERROR: Error limpiando datos: ${error}`);
    }
  };

  const testRouteNavigation = () => {
    try {
      addDebugInfo('🧪 Test de navegación simplificado...');
      
      // Verificar datos en localStorage
      const patients = localStorage.getItem('aiduxcare_v2_patients');
      addDebugInfo(`STATS: Pacientes en localStorage: ${patients ? 'SÍ' : 'NO'}`);
      
      if (patients) {
        const parsedPatients = JSON.parse(patients);
        addDebugInfo(`👥 Total pacientes: ${parsedPatients.length}`);
        
        if (parsedPatients.length > 0) {
          addDebugInfo(`TARGET: Primer paciente: ${parsedPatients[0].name} (ID: ${parsedPatients[0].id})`);
        }
      }
      
    } catch (error) {
      addDebugInfo(`ERROR: Error en test: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🔍 Diagnóstico del Sistema de Autenticación
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel de Control */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">Panel de Control</h2>
              
              <button
                onClick={loadUsers}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                RELOAD: Recargar Usuarios
              </button>
              
              <button
                onClick={createTestUser}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                USER: Crear Usuario de Prueba
              </button>
              
              <button
                onClick={clearPatientData}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                🏥 Limpiar Solo Pacientes
              </button>
              
              <button
                onClick={clearUserData}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                USER: Limpiar Datos de Usuario
              </button>
              
              <button
                onClick={clearAllData}
                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                🧹 Limpiar Todos los Datos
              </button>
            </div>

            {/* Panel de Pruebas */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">Pruebas</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de Prueba
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña de Prueba
                </label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              
              <button
                onClick={testPasswordHash}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                🔐 Probar Hash de Contraseña
              </button>
              
              <button
                onClick={testUserLogin}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                🔍 Probar Login de Usuario
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            👥 Usuarios Registrados ({users.length})
          </h2>
          
          {users.length === 0 ? (
            <p className="text-gray-500">No hay usuarios registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Rol</th>
                    <th className="px-4 py-2 text-left">Temporal</th>
                    <th className="px-4 py-2 text-left">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'OWNER' ? 'bg-red-100 text-red-800' :
                          user.role === 'PHYSICIAN' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {user.isTemporary ? '⏰ Sí' : 'SUCCESS: No'}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Log de Debug */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            📝 Log de Debug
          </h2>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p>No hay información de debug aún...</p>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="mb-1">{info}</div>
              ))
            )}
          </div>
          
          <button
            onClick={() => setDebugInfo([])}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            🧹 Limpiar Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPage; 