#!/usr/bin/env node

/**
 * Script de humo REST para Firebase UAT
 * Llama directamente a IdentityToolkit API sin SDK
 * Para diferenciar problema de SDK vs configuración del proyecto
 * @author AiDuxCare Development Team
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local no encontrado');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (value && !key.startsWith('#')) {
        envVars[key.trim()] = value;
      }
    }
  });

  return envVars;
}

// Función para hacer request HTTPS
function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Función principal de test
async function testFirebaseSignup() {
  console.log('🧪 SCRIPT DE HUMO REST - FIREBASE UAT SIGNUP\n');

  try {
    // Cargar variables de entorno
    const envVars = loadEnvVars();
    
    // Verificar variables críticas
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_AUTH_DOMAIN'
    ];

    const missingVars = requiredVars.filter(key => !envVars[key]);
    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    }

    const apiKey = envVars.VITE_FIREBASE_API_KEY;
    const projectId = envVars.VITE_FIREBASE_PROJECT_ID;
    const authDomain = envVars.VITE_FIREBASE_AUTH_DOMAIN;

    console.log('📋 CONFIGURACIÓN UAT:');
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Auth Domain: ${authDomain}`);
    console.log(`   API Key: ${apiKey.substring(0, 20)}...`);

    // Verificar que sea UAT
    if (!projectId.includes('uat')) {
      throw new Error(`Configuración NO es UAT: ${projectId}`);
    }

    // Preparar datos de prueba
    const testEmail = `test-smoke-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log('\n🧪 TEST: CREACIÓN DE USUARIO VÍA REST API');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Endpoint: https://identitytoolkit.googleapis.com/v1/accounts:signUp`);

    // Configurar request
    const postData = JSON.stringify({
      email: testEmail,
      password: testPassword,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      port: 443,
      path: `/v1/accounts:signUp?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'AiDuxCare-SmokeTest/1.0'
      }
    };

    console.log('\n🚀 ENVIANDO REQUEST REST...');
    
    // Hacer request
    const response = await makeRequest(options, postData);
    
    console.log('\n📊 RESPUESTA RECIBIDA:');
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Headers:`, response.headers);
    
    if (response.data) {
      console.log(`   Response Data:`, JSON.stringify(response.data, null, 2));
    }

    // Análisis de la respuesta
    console.log('\n🔍 ANÁLISIS DE LA RESPUESTA:');
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ ÉXITO: Usuario creado exitosamente vía REST API');
      console.log('   Esto significa que el problema NO es del proyecto UAT');
      console.log('   El problema está en la configuración del SDK/cliente');
      
      if (response.data && response.data.localId) {
        console.log(`   UID del usuario: ${response.data.localId}`);
      }
      
    } else if (response.statusCode === 400) {
      console.log('❌ ERROR 400: Request malformado o configuración incorrecta');
      
      if (response.data && response.data.error) {
        const error = response.data.error;
        console.log(`   Error Code: ${error.code}`);
        console.log(`   Error Message: ${error.message}`);
        
        if (error.code === 'OPERATION_NOT_ALLOWED') {
          console.log('\n🚨 DIAGNÓSTICO CRÍTICO: OPERATION_NOT_ALLOWED');
          console.log('   El proyecto UAT está bloqueando la creación de usuarios');
          console.log('   Esto confirma que el problema NO es del código/cliente');
          console.log('   El problema está en la configuración del proyecto UAT');
        }
      }
      
    } else {
      console.log(`⚠️ STATUS INESPERADO: ${response.statusCode}`);
      console.log('   Respuesta no estándar, requiere investigación adicional');
    }

  } catch (error) {
    console.log('❌ ERROR EN EL TEST:');
    console.log(`   ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('   Error de conectividad de red');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   Conexión rechazada');
    }
  }
}

// Ejecutar test
if (require.main === module) {
  testFirebaseSignup()
    .then(() => {
      console.log('\n✨ Script de humo REST completado');
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { testFirebaseSignup };
