/**
 * AiduxCare – Analytics Cloud Functions
 */

import * as admin from 'firebase-admin';

admin.initializeApp();

export {
  dailyMetricsRollup,
  updateRealTimeMetrics,
} from './functions-metricsRollup';

