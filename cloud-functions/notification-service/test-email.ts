// test-email.ts
// Script de integración para probar el envío de email de bienvenida

import fetch from 'node-fetch';

const ENDPOINT = 'https://us-east1-aiduxcare-mvp-uat.cloudfunctions.net/notification-service'; // Reemplaza con la URL real tras el deploy

async function testSendEmail() {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'correo-de-prueba@aiduxcare.com',
      name: 'Usuario de Prueba'
    })
  });
  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Respuesta:', data);
}

testSendEmail().catch(console.error);

// Instrucciones:
// 1. Reemplaza ENDPOINT por la URL real de la Cloud Function desplegada.
// 2. Ejecuta: npx tsx test-email.ts
// 3. Verifica que el email llegue a la bandeja de entrada de prueba. 