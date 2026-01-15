/**
 * AiduxCare - Analytics Cloud Functions
 * 
 * Functions for metrics aggregation and real-time counters
 * Firebase Functions v2 (Node.js 20)
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { startOfDay, subDays, format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

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
export const dailyMetricsRollup = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: TIMEZONE,
    region: 'us-central1',
  },
  async (event) => {
    const executionStart = Date.now();
    console.log('[dailyMetricsRollup] Starting daily metrics aggregation...');

    try {
      // Calculate yesterday's date range in Toronto timezone
      const now = new Date();
      const torontoTime = utcToZonedTime(now, TIMEZONE);
      const yesterday = subDays(torontoTime, 1);
      const startOfYesterday = startOfDay(yesterday);
      const endOfYesterday = new Date(startOfYesterday.getTime() + 24 * 60 * 60 * 1000 - 1);

      console.log(`[dailyMetricsRollup] Processing events from ${format(startOfYesterday, 'yyyy-MM-dd')} to ${format(endOfYesterday, 'yyyy-MM-dd')}`);

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

      const dateKey = format(startOfYesterday, 'yyyy-MM-dd');

      // Write to metrics_tech
      await db.collection('metrics_tech').doc(dateKey).set({
        date: dateKey,
        timestamp: startOfYesterday.getTime(),
        ...techMetrics,
        processedAt: Date.now(),
        eventCount: events.length,
      }, { merge: true });

      // Write to metrics_growth
      await db.collection('metrics_growth').doc(dateKey).set({
        date: dateKey,
        timestamp: startOfYesterday.getTime(),
        ...growthMetrics,
        processedAt: Date.now(),
        eventCount: events.length,
      }, { merge: true });

      const executionTime = Date.now() - executionStart;
      console.log(`[dailyMetricsRollup] ✅ Completed in ${executionTime}ms. Processed ${events.length} events.`);
    } catch (error) {
      console.error('[dailyMetricsRollup] ❌ Error:', error);
      throw error;
    }
  }
);

/**
 * Update Real-Time Metrics
 * 
 * Firestore trigger that updates counters whenever a new analytics event is created
 * Updates metrics_realtime/counters with:
 * - totalEvents
 * - eventsToday
 * - lastUpdate
 */
export const updateRealTimeMetrics = onDocumentCreated(
  {
    document: 'analytics_events/{eventId}',
    region: 'us-central1',
  },
  async (event) => {
    const eventData = event.data?.data();
    if (!eventData) {
      console.warn('[updateRealTimeMetrics] No event data found, skipping');
      return;
    }

    console.log(`[updateRealTimeMetrics] Processing new event: ${event.params.eventId}`);

    try {
      const countersRef = db.collection('metrics_realtime').doc('counters');

      // Get current date in Toronto timezone for today's count
      const now = new Date();
      const torontoTime = utcToZonedTime(now, TIMEZONE);
      const todayStart = startOfDay(torontoTime).getTime();
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
    } catch (error) {
      console.error('[updateRealTimeMetrics] ❌ Error:', error);
      // Don't throw - we don't want to fail the event creation
    }
  }
);

/**
 * Aggregate Technical Metrics
 * 
 * Calculates technical/performance metrics from events
 */
function aggregateTechMetrics(events: any[]): any {
  const categories = events.reduce((acc, event) => {
    const cat = event.category || 'unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
function aggregateGrowthMetrics(events: any[]): any {
  const uniqueUsers = new Set<string>();
  const uniqueSessions = new Set<string>();

  events.forEach(event => {
    if (event.metadata?.userIdHash) {
      uniqueUsers.add(event.metadata.userIdHash);
    }
    if (event.metadata?.sessionIdHash) {
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

