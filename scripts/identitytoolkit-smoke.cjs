#!/usr/bin/env node
/* scripts/identitytoolkit-smoke.cjs
   Node >= 18 — sin dependencias externas
   Uso:
     # UAT (usa .env.local con key UAT)
     node scripts/identitytoolkit-smoke.cjs UAT

     # PROD (exporta key de PROD solo para este comando)
     VITE_FIREBASE_API_KEY="<KEY_PROD>" node scripts/identitytoolkit-smoke.cjs PROD

   Exit codes:
     0 = éxito según expectativas del target
     1 = petición ejecutada pero no cumple expectativas
     2 = precondición inválida (ej. key no pertenece al target, falta env, error de red/parsing)
*/
const https = require('node:https');

const label = (process.argv[2] || 'UAT').toUpperCase().trim();
const API_KEY = process.env.VITE_FIREBASE_API_KEY;
const AUTH_DOMAIN = process.env.VITE_FIREBASE_AUTH_DOMAIN || ''; // informativo
const email = `smoke_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`.toLowerCase();
const password = 'P4ssw0rd_smoke_UAT'; // dummy

if (!API_KEY) {
  console.error(JSON.stringify({ label, error: 'Missing env VITE_FIREBASE_API_KEY' }, null, 2));
  process.exit(2);
}

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

(async () => {
  // 1) Preflight: verificar a qué proyecto pertenece esta API key
  const preflightURL = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${API_KEY}`;
  const pre = await httpJSON('GET', preflightURL);

  if (pre.status !== 200 || !pre.body) {
    console.error(JSON.stringify({ label, step: 'preflight', status: pre.status, body: pre.body }, null, 2));
    process.exit(2);
  }

  const projectId = pre.body.projectId || '';
  const emailEnabled = !!(pre.body.signIn && pre.body.signIn.email && pre.body.signIn.email.enabled);
  const authorizedDomains = pre.body.authorizedDomains || [];

  // Imprime preflight informativo
  console.log(
    JSON.stringify(
      {
        label,
        preflight: {
          projectId,
          emailEnabled,
          authorizedDomains,
          authDomain: AUTH_DOMAIN || undefined,
        },
      },
      null,
      2
    )
  );

  // Validar coherencia key ↔ label usando authorizedDomains como fallback
  const mustContain = label === 'UAT' ? 'uat' : 'prod';
  const projectIdValid = projectId.toLowerCase().includes(mustContain);
  const domainsValid = authorizedDomains.some(domain => domain.toLowerCase().includes(mustContain));
  
  if (!projectIdValid && !domainsValid) {
    console.error(
      JSON.stringify(
        {
          label,
          error: `API key no coincide con target esperado (${label}): projectId=${projectId}, authorizedDomains=${authorizedDomains.join(', ')}`,
        },
        null,
        2
      )
    );
    process.exit(2);
  }

  // 2) SignUp: prueba de comportamiento esperado por entorno
  const signUpURL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
  const payload = { email, password, returnSecureToken: true };
  const result = await httpJSON('POST', signUpURL, payload);

  const output = {
    label,
    projectId,
    status: result.status,
    body: result.body,
  };
  console.log(JSON.stringify(output, null, 2));

  // 3) Éxito/Fallo según entorno:
  // - UAT: éxito si 200 y existe body.localId
  // - PROD: éxito si 400 y body.error.message incluye OPERATION_NOT_ALLOWED
  if (label === 'UAT') {
    const ok = result.status === 200 && result.body && result.body.localId;
    process.exit(ok ? 0 : 1);
  } else {
    const msg = String(result.body && result.body.error && result.body.error.message || '');
    const blocked = result.status === 400 && /OPERATION_NOT_ALLOWED/i.test(msg);
    process.exit(blocked ? 0 : 1);
  }
})().catch((e) => {
  console.error(JSON.stringify({ label, error: String(e && e.message ? e.message : e) }, null, 2));
  process.exit(2);
});
