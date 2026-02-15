/**
 * WO-METRICS-00: metricsIngest - Callable Cloud Function
 * Ingests metrics events with HMAC userIdHash (no UID/email persisted)
 * METRICS_PEPPER from Firebase config or env (fail closed if missing)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

const LOCATION = 'northamerica-northeast1';
const COLLECTION = 'metrics_events';
const MAX_STRING_LENGTH = 64;

// Forbidden keys (PHI / clinical content)
const FORBIDDEN_KEYS = new Set([
  'transcript', 'soap', 'text', 'note', 'subjective', 'objective',
  'assessment', 'plan', 'prompt', 'content', 'email', 'phone', 'name',
  'patientId', 'patient_id', 'uid', 'userId', 'user_id'
]);

// Whitelist of allowed event names (WO-METRICS-02: standardized metrics_* prefix)
const ALLOWED_EVENTS = new Set([
  // Test events
  'metrics_smoke_test',

  // Workflow lifecycle (standardized naming)
  'metrics_workflow_started', // was: workflow_session_started
  'metrics_workflow_heartbeat', // was: workflow_heartbeat
  'metrics_workflow_completed', // was: workflow_session_completed
  'metrics_workflow_abandoned', // was: workflow_session_abandoned

  // Workflow interaction
  'metrics_workflow_tab_viewed', // was: workflow_tab_viewed

  // SOAP generation
  'metrics_soap_generate_clicked', // was: soap_generate_clicked
  'metrics_soap_generated_success', // was: soap_generated_success
]);

// Whitelist of allowed metrics keys (WO-00 + WO-01)
const ALLOWED_METRICS_KEYS = new Set([
  'ok', 'ms', 'bytes', 'count', 'flag', 'model', 'tab', 'route',
  'latencyMs', 'activeMs', 'idleMs', 'totalDurationMs', 'activeSinceLastBeatMs',
  'schemaVersion',
]);

function hmacSha256Hex(message, pepper) {
  return crypto.createHmac('sha256', pepper).update(message).digest('hex').slice(0, 40);
}

function validateMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(metrics)) {
    const key = k.toLowerCase();
    if (FORBIDDEN_KEYS.has(key)) {
      throw new functions.https.HttpsError('invalid-argument', `Forbidden key: ${k}`);
    }
    if (!ALLOWED_METRICS_KEYS.has(key)) {
      throw new functions.https.HttpsError('invalid-argument', `Unknown metrics key: ${k}`);
    }
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[k] = v;
    } else if (typeof v === 'boolean') {
      out[k] = v;
    } else if (typeof v === 'string') {
      if (v.length > MAX_STRING_LENGTH) {
        throw new functions.https.HttpsError('invalid-argument', `String too long: ${k}`);
      }
      out[k] = v;
    } else {
      throw new functions.https.HttpsError('invalid-argument', `Invalid type for ${k}`);
    }
  }
  return out;
}

exports.metricsIngest = functions.region(LOCATION).https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const pepper = process.env.METRICS_PEPPER || functions.config().metrics?.pepper;
  if (!pepper || typeof pepper !== 'string' || pepper.length < 16) {
    console.error('[metricsIngest] METRICS_PEPPER not configured');
    throw new functions.https.HttpsError('failed-precondition', 'Metrics not configured');
  }

  const {
    eventName,
    workflowSessionId,
    visitType,
    jurisdiction,
    context: ctx,
    metrics,
    browserSessionId
  } = data || {};

  if (!eventName || typeof eventName !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'eventName required');
  }
  if (!ALLOWED_EVENTS.has(eventName)) {
    throw new functions.https.HttpsError('invalid-argument', `Unknown event: ${eventName}`);
  }
  if (!workflowSessionId || typeof workflowSessionId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'workflowSessionId required');
  }
  if (workflowSessionId.length > 128) {
    throw new functions.https.HttpsError('invalid-argument', 'workflowSessionId too long');
  }

  const uid = context.auth.uid;
  const userIdHash = hmacSha256Hex(uid, pepper);

  const appVersion = (data.appVersion && typeof data.appVersion === 'string')
    ? data.appVersion.slice(0, MAX_STRING_LENGTH) : 'dev';
  const env = (data.env && ['pilot', 'local', 'uat'].includes(data.env)) ? data.env : 'uat';

  let validatedMetrics = {};
  try {
    validatedMetrics = validateMetrics(metrics);
  } catch (e) {
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('invalid-argument', e.message);
  }

  const validVisitTypes = ['initial', 'follow-up', 'discharge'];
  const validVisitType = visitType && validVisitTypes.includes(visitType) ? visitType : undefined;

  const validJurisdiction = jurisdiction === 'CA-ON' ? 'CA-ON' : undefined;

  let safeContext = {};
  if (ctx && typeof ctx === 'object') {
    if (ctx.route && typeof ctx.route === 'string' && ctx.route.length <= MAX_STRING_LENGTH) {
      safeContext.route = ctx.route;
    }
    if (ctx.tab && typeof ctx.tab === 'string' && ctx.tab.length <= MAX_STRING_LENGTH) {
      safeContext.tab = ctx.tab;
    }
  }

  const doc = {
    schemaVersion: 1,
    eventName,
    ts: admin.firestore.FieldValue.serverTimestamp(),
    appVersion,
    env,
    userIdHash,
    workflowSessionId,
    ...(browserSessionId && typeof browserSessionId === 'string' && browserSessionId.length <= 64 && { browserSessionId }),
    ...(validVisitType && { visitType: validVisitType }),
    ...(validJurisdiction && { jurisdiction: validJurisdiction }),
    ...(Object.keys(safeContext).length > 0 && { context: safeContext }),
    ...(Object.keys(validatedMetrics).length > 0 && { metrics: validatedMetrics }),
  };

  if (!admin.apps.length) admin.initializeApp();
  const db = admin.firestore();
  await db.collection(COLLECTION).add(doc);

  return { ok: true };
});
