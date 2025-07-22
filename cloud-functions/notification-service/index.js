// notification-service/index.js
// Cloud Function para enviar emails de bienvenida usando Gmail API
// Requiere credenciales OAuth2 o Service Account con delegación de dominio
// El archivo de credenciales debe llamarse credentials.json y estar en el mismo directorio

const { google } = require('googleapis');
const functions = require('@google-cloud/functions-framework');
const fs = require('fs');
const path = require('path');

// CONFIGURACIÓN
const SENDER_EMAIL = 'welcome@aiduxcare.com';
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// Cargar credenciales
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

// Autenticación OAuth2
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: SCOPES,
});

// Utilidad para construir el mensaje RFC822
function makeEmail(to, name) {
  const subject = 'Bienvenido a AiDuxCare';
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Bienvenido a AiDuxCare, ${name}!</h2>
      <p>Tu cuenta ha sido creada exitosamente. Ya puedes acceder a la plataforma y comenzar a usar nuestros servicios de IA clínica.</p>
      <p>Si tienes dudas, contáctanos en <a href="mailto:info@aiduxcare.com">info@aiduxcare.com</a>.</p>
      <hr/>
      <small>Este email fue enviado automáticamente. No respondas a este mensaje.</small>
    </div>
  `;
  const message = [
    `From: AiDuxCare <${SENDER_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html
  ].join('\n');
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

// Cloud Function HTTP
functions.http('notification-service', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  const { to, name } = req.body;
  if (!to || !name) {
    return res.status(400).json({ error: 'Faltan parámetros: to, name' });
  }
  try {
    const client = await auth.getClient();
    const gmail = google.gmail({ version: 'v1', auth: client });
    const raw = makeEmail(to, name);
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    res.status(200).json({ success: true, message: 'Email enviado correctamente' });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({ error: 'Error enviando email', details: error.message });
  }
});

// Instrucciones para el equipo:
// 1. Habilitar la API de Gmail en Google Cloud Console.
// 2. Crear credenciales OAuth2 o Service Account con delegación de dominio para welcome@aiduxcare.com.
// 3. Descargar el archivo credentials.json y colocarlo en este directorio.
// 4. Desplegar la función con gcloud functions deploy notification-service --runtime nodejs18 --trigger-http --allow-unauthenticated 