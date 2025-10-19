#!/usr/bin/env node
/* scripts/diagnose-credentials-deep.cjs
   Diagnóstico profundo de credenciales con email correcto
*/

const https = require('node:https');

// Configuración UAT
const UAT_API_KEY = 'AIzaSyCAf7jz6y-dZHVJmxuuCaYeD_IKLom69Sc';
const UAT_PROJECT_ID = 'aiduxcare-v2-uat-dev';

// Emails a probar (diferentes variaciones)
const TEST_EMAILS = [
  'mauricio@aiduxcare.co',      // Firebase Console muestra .co
  'mauricio@aiduxcare.com',     // UI del navegador usa .com
  'Mauricio@aiduxcare.co',      // Con mayúscula
  'Mauricio@aiduxcare.com'      // Con mayúscula
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

async function diagnoseCredentialsDeep() {
  console.log('🔍 DIAGNÓSTICO PROFUNDO DE CREDENCIALES');
  console.log('=========================================');
  console.log(`🏗️  Proyecto UAT: ${UAT_PROJECT_ID}`);
  console.log(`🔑 API Key: ${UAT_API_KEY.substring(0, 20)}...`);
  console.log('');

  try {
    // 1. VERIFICAR CONFIGURACIÓN DEL PROYECTO
    console.log('🔧 PASO 1: Verificando configuración del proyecto...');
    const configURL = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${UAT_API_KEY}`;
    const configResult = await httpJSON('GET', configURL);
    
    if (configResult.status === 200) {
      console.log('✅ Configuración del proyecto obtenida:');
      console.log(`   Project ID: ${configResult.body.projectId}`);
      console.log(`   Email habilitado: ${configResult.body.signIn?.email?.enabled}`);
      console.log(`   Dominios autorizados: ${configResult.body.authorizedDomains?.join(', ')}`);
      console.log(`   Configuración completa:`, JSON.stringify(configResult.body, null, 2));
    } else {
      console.log('❌ Error obteniendo configuración:', configResult.status);
      console.log('   Respuesta:', configResult.body);
    }
    console.log('');

    // 2. PROBAR TODOS LOS EMAILS
    console.log('🔍 PASO 2: Probando todos los emails...');
    for (const email of TEST_EMAILS) {
      console.log(`\n📧 Probando: ${email}`);
      
      // Verificar si existe
      const lookupURL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${UAT_API_KEY}`;
      const lookupPayload = { email };
      const lookupResult = await httpJSON('POST', lookupURL, lookupPayload);
      
      if (lookupResult.status === 200) {
        console.log('   ✅ Usuario ENCONTRADO:');
        const user = lookupResult.body.users[0];
        console.log(`      User ID: ${user.localId}`);
        console.log(`      Email verificado: ${user.emailVerified}`);
        console.log(`      Creado: ${new Date(parseInt(user.createdAt)).toLocaleString()}`);
        console.log(`      Último login: ${user.lastLoginAt ? new Date(parseInt(user.lastLoginAt)).toLocaleString() : 'Nunca'}`);
        
        // Intentar login con contraseña temporal
        console.log('   🔐 Intentando login...');
        const signInURL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${UAT_API_KEY}`;
        const signInPayload = { 
          email, 
          password: 'TempPass123!',
          returnSecureToken: true 
        };
        const signInResult = await httpJSON('POST', signInURL, signInPayload);
        
        if (signInResult.status === 200) {
          console.log('      ✅ Login EXITOSO');
          console.log(`         User ID: ${signInResult.body.localId}`);
          console.log(`         ID Token: ${signInResult.body.idToken?.substring(0, 20)}...`);
        } else {
          console.log('      ❌ Login FALLÓ:', signInResult.status);
          console.log(`         Error: ${signInResult.body.error?.message}`);
          console.log(`         Código: ${signInResult.body.error?.code}`);
        }
        
      } else if (lookupResult.status === 400 && lookupResult.body.error?.message?.includes('USER_NOT_FOUND')) {
        console.log('   ❌ Usuario NO encontrado');
      } else {
        console.log('   ⚠️  Respuesta inesperada:', lookupResult.status);
        console.log(`      Error: ${lookupResult.body.error?.message}`);
      }
    }
    console.log('');

    // 3. ANÁLISIS DE LA CONTRADICCIÓN
    console.log('🎯 ANÁLISIS DE LA CONTRADICCIÓN:');
    console.log('================================');
    console.log('📊 SITUACIÓN ACTUAL:');
    console.log('   - Firebase Console: Usuario EXISTE (mauricio@aiduxcare.co...)');
    console.log('   - Script de diagnóstico: Usuario NO encontrado');
    console.log('   - UI del navegador: Banner verde "Email verificado"');
    console.log('   - Login: Fallando con "Credenciales inválidas"');
    console.log('');
    console.log('🔍 POSIBLES CAUSAS:');
    console.log('   1. Diferencia de dominio (.co vs .com)');
    console.log('   2. Problema de autenticación en API REST');
    console.log('   3. Usuario existe pero no es accesible via API');
    console.log('   4. Problema de permisos en API Key');
    console.log('   5. Diferencia entre Firebase Auth y Identity Toolkit API');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR EN DIAGNÓSTICO PROFUNDO:', error.message);
  }
}

// Ejecutar diagnóstico profundo
diagnoseCredentialsDeep().catch(console.error);
