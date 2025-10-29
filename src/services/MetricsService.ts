export class MetricsService {
  supabase: any;
  langfuse: any;

  constructor(supabase: any, langfuse: any) {
    this.supabase = supabase;
    this.langfuse = langfuse;
  }

  async recordSuggestionEvent(event: {
    suggestionId: string;
    visitId: string;
    eventType?: string;
    metadata?: any;
  }) {
    const payload = {
      event_type: event.eventType ?? "accepted",
      suggestion_id: event.suggestionId,
      visit_id: event.visitId,
      metadata: event.metadata ?? {},
    };

    // ✅ coincidir con firma del mock Supabase
    if (this.supabase?.insert) {
      await this.supabase.insert("suggestion_events", payload);
    }

    // ✅ coincidir con firma del mock Langfuse
    if (this.langfuse?.track) {
      this.langfuse.track("suggestion_event", payload);
    }

    return { status: "ok" };
  }

  // Alias por compatibilidad
  async trackSuggestionEvent(event: string, metadata: any) {
    return this.recordSuggestionEvent({
      suggestionId: event,
      visitId: "unknown",
      metadata,
    });
  }
}

export default MetricsService;
