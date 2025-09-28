// @ts-nocheck
export type Entity = { id: string; text: string; confidence: number };
export type Insight = { id: string; title: string; description?: string; severity?: 'low'|'medium'|'high'|'critical' };

export class TranscriptProcessor {
  static async process(transcript: string): Promise<{ entities: Entity[]; insights: Insight[] }> {
    if (!transcript || !transcript.trim()) return { entities: [], insights: [] };
    // TODO: Implementar NER/insights real. Stub por ahora.
    return { entities: [], insights: [] };
  }
}
export default TranscriptProcessor;