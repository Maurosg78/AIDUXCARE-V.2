// src/core/metrics/MetricsService.ts
import type { SuggestionEvent } from "./MetricsTypes";

export interface SupabasePort {
  insert(table: string, row: Record<string, unknown>): Promise<void>;
}

export interface LangfusePort {
  track(event: string, props: Record<string, unknown>): void;
}

export class MetricsService {
  constructor(private db: SupabasePort, private lf: LangfusePort) {}

  async recordSuggestionEvent(ev: SuggestionEvent): Promise<void> {
    await this.db.insert("suggestion_events", {
      suggestion_id: ev.suggestionId,
      visit_id: ev.visitId,
      event_type: ev.type,
      at: ev.atISO,
      meta: ev.meta ?? null,
    });
    this.lf.track("suggestion_event", ev as unknown as Record<string, unknown>);
  }

  async recordTimeSaved(visitId: string, minutes: number): Promise<void> {
    await this.db.insert("productivity_metrics", {
      visit_id: visitId,
      minutes_saved_estimate: minutes,
      at: new Date().toISOString(),
    });
    this.lf.track(
      "time_saved",
      ({ visitId, minutes } as unknown) as Record<string, unknown>
    );
  }

  async recordComplianceResult(
    visitId: string,
    ruleId: string,
    pass: boolean,
    details?: string
  ): Promise<void> {
    await this.db.insert("compliance_results", {
      visit_id: visitId,
      rule_id: ruleId,
      pass,
      details: details ?? null,
      at: new Date().toISOString(),
    });
    this.lf.track(
      "compliance_result",
      ({ visitId, ruleId, pass } as unknown) as Record<string, unknown>
    );
  }
}
