import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('AnalyticsService.trackValueMetrics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    import.meta.env.VITE_ANALYTICS_USER_SALT = 'user-salt-1234567890-user-salt-1234';
    import.meta.env.VITE_ANALYTICS_SESSION_SALT = 'session-salt-1234567890-session-s';
  });

  it('pseudonymizes user and session identifiers before persistence', async () => {
    vi.doMock('firebase/firestore', async () => {
      const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
      return {
        ...actual,
        collection: vi.fn(() => 'value_analytics_ref'),
        addDoc: vi.fn().mockResolvedValue({ id: 'value-analytics-doc' }),
        serverTimestamp: vi.fn(() => 'server-timestamp'),
      };
    });

    const { AnalyticsService } = await import('../analyticsService');
    const { addDoc } = await import('firebase/firestore');

    await AnalyticsService.trackValueMetrics({
      userId: 'user-raw-123',
      sessionId: 'session-raw-123',
      timestamps: {
        sessionStart: new Date('2026-04-14T10:00:00.000Z'),
        soapFinalized: new Date('2026-04-14T10:10:00.000Z'),
      },
      calculatedTimes: {
        totalDocumentationTime: 10,
      },
      featuresUsed: {
        transcription: true,
        physicalTests: false,
        aiSuggestions: false,
        soapGeneration: true,
      },
      quality: {
        soapSectionsCompleted: {
          subjective: true,
          objective: true,
          assessment: true,
          plan: true,
        },
      },
      sessionType: 'initial',
      region: 'Madrid',
    });

    expect(addDoc).toHaveBeenCalledTimes(1);

    const addDocCalls = vi.mocked(addDoc).mock.calls;
    const persistedEvent = addDocCalls[0]?.[1] as Record<string, unknown>;

    expect(persistedEvent.hashedUserId).toMatch(/^[a-f0-9]{64}$/);
    expect(persistedEvent.hashedSessionId).toMatch(/^[a-f0-9]{64}$/);
    expect(persistedEvent.hashedUserId).not.toBe('user-raw-123');
    expect(persistedEvent.hashedSessionId).not.toBe('session-raw-123');
    expect(persistedEvent.quality).toEqual({
      soapSectionsCompleted: {
        subjective: true,
        objective: true,
        assessment: true,
        plan: true,
      },
      suggestionsOffered: null,
      suggestionsAccepted: null,
      suggestionsRejected: null,
      editsMadeToSOAP: null,
    });
  });
});
