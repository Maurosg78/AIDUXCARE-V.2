#!/usr/bin/env node
/* scripts/verify-user-direct.cjs
   Verificación directa de usuarios sin autenticación previa
*/

const https = require('node:https');

// Configuración UAT
const UAT_API_KEY = 'AIzaSyCAf7jz6y-dZHVJmxuuCaYeD_IKLom69Sc';
const UAT_PROJECT_ID = 'aiduxcare-v2-uat-dev';

// Emails a probar
const TEST_EMAILS = [
  'mauricio@aiduxcare.co',
  'mauricio@aiduxcare.com',
  'Mauricio@aiduxcare.co',
  'Mauricio@aiduxcare.com'
];

function httpJSON(method, url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = data ? JSON.stringify(data) : null;
    const req = https.request(
      {
        method,
        hostname: u.hostname,
        path: u.pathname + u.search,
        headers: {
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { raw };
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function verifyUserDirect() {
  console.log('🔍 VERIFICACIÓN DIRECTA DE USUARIOS');
  console.log('====================================');
  console.log(`🏗️  Proyecto UAT: ${UAT_PROJECT_ID}`);
  console.log('');

  try {
    // 1. VERIFICAR CONFIGURACIÓN DEL PROYECTO
    console.log('🔧 PASO 1: Verificando configuración del proyecto...');
    const configURL = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${UAT_API_KEY}`;
    const configResult = await httpJSON('GET', configURL);
    
    if (configResult.status === 200) {
      console.log('✅ Configuración del proyecto obtenida:');
      console.log(`   Project ID: ${configResult.body.projectId}`);
      console.log(`   Dominios autorizados: ${configResult.body.authorizedDomains?.join(', ')}`);
    } else {
      console.log('❌ Error obteniendo configuración:', configResult.status);
      return;
    }
    console.log('');

    // 2. INTENTAR LOGIN DIRECTO CON CONTRASEÑAS COMUNES
    console.log('🔐 PASO 2: Intentando login directo...');
    for (const email of TEST_EMAILS) {
      console.log(`\n📧 Probando: ${email}`);
      
      // Contraseñas comunes a probar
      const passwords = [
        'TempPass123!',
        'password123',
        '123456',
        'admin',
        'test123',
        'mauricio123',
        'aidux2025'
      ];
      
      for (const password of passwords) {
        console.log(`   🔑 Probando contraseña: ${password}`);
        
        const signInURL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${UAT_API_KEY}`;
        const signInPayload = { 
          email, 
          password,
          returnSecureToken: true 
        };
        
        try {
          const signInResult = await httpJSON('POST', signInURL, signInPayload);
          
          if (signInResult.status === 200) {
            console.log(`      ✅ LOGIN EXITOSO con contraseña: ${password}`);
            console.log(`         User ID: ${signInResult.body.localId}`);
            console.log(`         Email: ${signInResult.body.email}`);
            console.log(`         ID Token: ${signInResult.body.idToken?.substring(0, 20)}...`);
            
            // Ahora que tenemos token, verificar usuario
            console.log('      🔍 Verificando usuario con token...');
            const lookupURL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${UAT_API_KEY}`;
            const lookupPayload = { idToken: signInResult.body.idToken };
            const lookupResult = await httpJSON('POST', lookupURL, lookupPayload);
            
            if (lookupResult.status === 200) {
              const user = lookupResult.body.users[0];
              console.log(`         ✅ Usuario verificado:`);
              console.log(`            Email verificado: ${user.emailVerified}`);
              console.log(`            Creado: ${new Date(parseInt(user.createdAt)).toLocaleString()}`);
              console.log(`            Último login: ${user.lastLoginAt ? new Date(parseInt(user.lastLoginAt)).toLocaleString() : 'Nunca'}`);
            } else {
              console.log(`         ⚠️  No se pudo verificar usuario: ${lookupResult.status}`);
            }
            
            return; // Usuario encontrado, salir
          } else if (signInResult.status === 400) {
            const errorMsg = signInResult.body.error?.message || 'Error desconocido';
            if (errorMsg.includes('INVALID_LOGIN_CREDENTIALS')) {
              console.log(`         ❌ Contraseña incorrecta`);
            } else if (errorMsg.includes('USER_NOT_FOUND')) {
              console.log(`         ❌ Usuario no existe`);
              break; // No probar más contraseñas
            } else {
              console.log(`         ⚠️  Error: ${errorMsg}`);
            }
          } else {
            console.log(`         ⚠️  Respuesta inesperada: ${signInResult.status}`);
          }
        } catch (error) {
          console.log(`         ❌ Error de red: ${error.message}`);
        }
      }
    }
    console.log('');

    // 3. RESUMEN
    console.log('🎯 RESUMEN DE VERIFICACIÓN:');
    console.log('============================');
    console.log('📊 RESULTADO:');
    console.log('   - Si algún login fue exitoso: Usuario existe y contraseña conocida');
    console.log('   - Si todos fallaron: Usuario no existe o contraseña desconocida');
    console.log('   - Firebase Console puede mostrar usuarios de sesiones anteriores');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR EN VERIFICACIÓN:', error.message);
  }
}

// Ejecutar verificación directa
verifyUserDirect().catch(console.error);
