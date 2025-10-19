#!/usr/bin/env node
/* scripts/diagnose-credentials.cjs
   Diagnóstico de credenciales contradictorias en UAT
*/

const https = require('node:https');

// Configuración UAT
const UAT_API_KEY = 'AIzaSyCAf7jz6y-dZHVJmxuuCaYeD_IKLom69Sc';
const UAT_PROJECT_ID = 'aiduxcare-v2-uat-dev';

// Email del usuario que está fallando
const TEST_EMAIL = 'Mauricio@aiduxcare.com';

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

async function diagnoseCredentials() {
  console.log('🔍 DIAGNÓSTICO DE CREDENCIALES CONTRADICTORIAS');
  console.log('================================================');
  console.log(`📧 Email a diagnosticar: ${TEST_EMAIL}`);
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
      console.log(`   Email habilitado: ${configResult.body.signIn?.email?.enabled}`);
      console.log(`   Dominios autorizados: ${configResult.body.authorizedDomains?.join(', ')}`);
    } else {
      console.log('❌ Error obteniendo configuración:', configResult.status);
      console.log('   Respuesta:', configResult.body);
    }
    console.log('');

    // 2. VERIFICAR SI EL EMAIL EXISTE
    console.log('🔍 PASO 2: Verificando si el email existe...');
    const lookupURL = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${UAT_API_KEY}`;
    const lookupPayload = { email: TEST_EMAIL };
    const lookupResult = await httpJSON('POST', lookupURL, lookupPayload);
    
    if (lookupResult.status === 200) {
      console.log('✅ Usuario encontrado:');
      console.log(`   User ID: ${lookupResult.body.users[0].localId}`);
      console.log(`   Email verificado: ${lookupResult.body.users[0].emailVerified}`);
      console.log(`   Último login: ${lookupResult.body.users[0].lastLoginAt || 'Nunca'}`);
    } else if (lookupResult.status === 400 && lookupResult.body.error?.message?.includes('USER_NOT_FOUND')) {
      console.log('❌ Usuario NO encontrado en UAT');
    } else {
      console.log('⚠️  Respuesta inesperada:', lookupResult.status);
      console.log('   Error:', lookupResult.body.error?.message);
    }
    console.log('');

    // 3. INTENTAR LOGIN CON CONTRASEÑA TEMPORAL
    console.log('🔐 PASO 3: Intentando login con contraseña temporal...');
    const signInURL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${UAT_API_KEY}`;
    const signInPayload = { 
      email: TEST_EMAIL, 
      password: 'TempPass123!',
      returnSecureToken: true 
    };
    const signInResult = await httpJSON('POST', signInURL, signInPayload);
    
    if (signInResult.status === 200) {
      console.log('✅ Login exitoso con contraseña temporal');
      console.log(`   User ID: ${signInResult.body.localId}`);
      console.log(`   ID Token: ${signInResult.body.idToken?.substring(0, 20)}...`);
    } else {
      console.log('❌ Login falló:', signInResult.status);
      console.log('   Error:', signInResult.body.error?.message);
      console.log('   Código:', signInResult.body.error?.code);
    }
    console.log('');

    // 4. VERIFICAR ESTADO DE VERIFICACIÓN
    console.log('📧 PASO 4: Verificando estado de verificación...');
    if (lookupResult.status === 200) {
      const user = lookupResult.body.users[0];
      console.log('📊 Estado del usuario:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Verificado: ${user.emailVerified ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Creado: ${new Date(parseInt(user.createdAt)).toLocaleString()}`);
      console.log(`   Último login: ${user.lastLoginAt ? new Date(parseInt(user.lastLoginAt)).toLocaleString() : 'Nunca'}`);
      
      if (!user.emailVerified) {
        console.log('⚠️  PROBLEMA IDENTIFICADO: Email NO verificado');
        console.log('   Esto explica por qué el login falla');
      }
    }
    console.log('');

    // 5. RESUMEN DEL DIAGNÓSTICO
    console.log('🎯 RESUMEN DEL DIAGNÓSTICO:');
    console.log('============================');
    
    if (lookupResult.status === 200) {
      const user = lookupResult.body.users[0];
      if (!user.emailVerified) {
        console.log('❌ PROBLEMA: Email verificado en UI pero NO en Firebase');
        console.log('   - El banner verde es INCORRECTO');
        console.log('   - Firebase Auth requiere verificación real');
        console.log('   - El login fallará hasta que se verifique');
      } else {
        console.log('✅ Usuario verificado correctamente');
        console.log('   - El problema puede ser la contraseña');
      }
    } else {
      console.log('❌ PROBLEMA: Usuario no existe en UAT');
      console.log('   - El banner verde es INCORRECTO');
      console.log('   - No hay usuario para hacer login');
    }

  } catch (error) {
    console.error('❌ ERROR EN DIAGNÓSTICO:', error.message);
  }
}

// Ejecutar diagnóstico
diagnoseCredentials().catch(console.error);
