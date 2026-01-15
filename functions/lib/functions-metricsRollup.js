"use strict";
/**
 * AiduxCare - Analytics Cloud Functions
 *
 * Functions for metrics aggregation and real-time counters
 * Firebase Functions v2 (Node.js 20)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRealTimeMetrics = exports.dailyMetricsRollup = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const db = admin.firestore();
const TIMEZONE = 'America/Toronto';
/**
 * Daily Metrics Rollup
 *
 * Scheduled function that runs every day at 02:00 AM (America/Toronto)
 * Aggregates analytics events from the previous day and writes to:
 * - metrics_tech
 * - metrics_growth
 */
exports.dailyMetricsRollup = (0, scheduler_1.onSchedule)({
    schedule: '0 2 * * *',
    timeZone: TIMEZONE,
    region: 'us-central1',
}, async (event) => {
    const executionStart = Date.now();
    console.log('[dailyMetricsRollup] Starting daily metrics aggregation...');
    try {
        // Calculate yesterday's date range in Toronto timezone
        const now = new Date();
        const torontoTime = (0, date_fns_tz_1.utcToZonedTime)(now, TIMEZONE);
        const yesterday = (0, date_fns_1.subDays)(torontoTime, 1);
        const startOfYesterday = (0, date_fns_1.startOfDay)(yesterday);
        const endOfYesterday = new Date(startOfYesterday.getTime() + 24 * 60 * 60 * 1000 - 1);
        console.log(`[dailyMetricsRollup] Processing events from ${(0, date_fns_1.format)(startOfYesterday, 'yyyy-MM-dd')} to ${(0, date_fns_1.format)(endOfYesterday, 'yyyy-MM-dd')}`);
        // Query analytics_events from yesterday
        const eventsRef = db.collection('analytics_events');
        const snapshot = await eventsRef
            .where('timestamp', '>=', startOfYesterday.getTime())
            .where('timestamp', '<=', endOfYesterday.getTime())
            .get();
        const events = snapshot.docs.map(doc => doc.data());
        console.log(`[dailyMetricsRollup] Found ${events.length} events to process`);
        if (events.length === 0) {
            console.log('[dailyMetricsRollup] No events found, skipping aggregation');
            return;
        }
        // Aggregate metrics
        const techMetrics = aggregateTechMetrics(events);
        const growthMetrics = aggregateGrowthMetrics(events);
        const dateKey = (0, date_fns_1.format)(startOfYesterday, 'yyyy-MM-dd');
        // Write to metrics_tech
        await db.collection('metrics_tech').doc(dateKey).set(Object.assign(Object.assign({ date: dateKey, timestamp: startOfYesterday.getTime() }, techMetrics), { processedAt: Date.now(), eventCount: events.length }), { merge: true });
        // Write to metrics_growth
        await db.collection('metrics_growth').doc(dateKey).set(Object.assign(Object.assign({ date: dateKey, timestamp: startOfYesterday.getTime() }, growthMetrics), { processedAt: Date.now(), eventCount: events.length }), { merge: true });
        const executionTime = Date.now() - executionStart;
        console.log(`[dailyMetricsRollup] ✅ Completed in ${executionTime}ms. Processed ${events.length} events.`);
    }
    catch (error) {
        console.error('[dailyMetricsRollup] ❌ Error:', error);
        throw error;
    }
});
/**
 * Update Real-Time Metrics
 *
 * Firestore trigger that updates counters whenever a new analytics event is created
 * Updates metrics_realtime/counters with:
 * - totalEvents
 * - eventsToday
 * - lastUpdate
 */
exports.updateRealTimeMetrics = (0, firestore_1.onDocumentCreated)({
    document: 'analytics_events/{eventId}',
    region: 'us-central1',
}, async (event) => {
    var _a;
    const eventData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!eventData) {
        console.warn('[updateRealTimeMetrics] No event data found, skipping');
        return;
    }
    console.log(`[updateRealTimeMetrics] Processing new event: ${event.params.eventId}`);
    try {
        const countersRef = db.collection('metrics_realtime').doc('counters');
        // Get current date in Toronto timezone for today's count
        const now = new Date();
        const torontoTime = (0, date_fns_tz_1.utcToZonedTime)(now, TIMEZONE);
        const todayStart = (0, date_fns_1.startOfDay)(torontoTime).getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;
        // Get current counters
        const countersDoc = await countersRef.get();
        const currentCounters = countersDoc.data() || {
            totalEvents: 0,
            eventsToday: 0,
            lastUpdate: Date.now(),
        };
        // Count events today
        const todayEventsSnapshot = await db.collection('analytics_events')
            .where('timestamp', '>=', todayStart)
            .where('timestamp', '<=', todayEnd)
            .count()
            .get();
        const eventsToday = todayEventsSnapshot.data().count;
        // Update counters
        await countersRef.set({
            totalEvents: admin.firestore.FieldValue.increment(1),
            eventsToday: eventsToday,
            lastUpdate: Date.now(),
            lastEventId: event.params.eventId,
            lastEventCategory: eventData.category || 'unknown',
            lastEventAction: eventData.event || eventData.action || 'unknown',
        }, { merge: true });
        console.log(`[updateRealTimeMetrics] ✅ Updated counters. Total: ${currentCounters.totalEvents + 1}, Today: ${eventsToday}`);
    }
    catch (error) {
        console.error('[updateRealTimeMetrics] ❌ Error:', error);
        // Don't throw - we don't want to fail the event creation
    }
});
/**
 * Aggregate Technical Metrics
 *
 * Calculates technical/performance metrics from events
 */
function aggregateTechMetrics(events) {
    const categories = events.reduce((acc, event) => {
        const cat = event.category || 'unknown';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});
    const errors = events.filter(e => e.category === 'error').length;
    const workflows = events.filter(e => e.category === 'workflow').length;
    const sessions = events.filter(e => e.category === 'session').length;
    return {
        categories,
        errorCount: errors,
        workflowEventCount: workflows,
        sessionEventCount: sessions,
        totalEvents: events.length,
    };
}
/**
 * Aggregate Growth Metrics
 *
 * Calculates growth/user metrics from events
 */
function aggregateGrowthMetrics(events) {
    const uniqueUsers = new Set();
    const uniqueSessions = new Set();
    events.forEach(event => {
        var _a, _b;
        if ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.userIdHash) {
            uniqueUsers.add(event.metadata.userIdHash);
        }
        if ((_b = event.metadata) === null || _b === void 0 ? void 0 : _b.sessionIdHash) {
            uniqueSessions.add(event.metadata.sessionIdHash);
        }
    });
    const userEvents = events.filter(e => e.category === 'user' || e.category === 'auth').length;
    const featureUsage = events.filter(e => e.category === 'feature').length;
    return {
        uniqueUsers: uniqueUsers.size,
        uniqueSessions: uniqueSessions.size,
        userEventCount: userEvents,
        featureUsageCount: featureUsage,
        totalEvents: events.length,
    };
}
//# sourceMappingURL=functions-metricsRollup.js.map