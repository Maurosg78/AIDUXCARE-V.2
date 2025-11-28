import { z } from "zod";

export const TimestampSchema = z.object({
  _seconds: z.number().int(),
  _nanoseconds: z.number().int().min(0).max(999_999_999),
});
export type Timestamp = z.infer<typeof TimestampSchema>;

export function timestampToDate(ts: Timestamp): Date {
  return new Date(ts._seconds * 1000 + ts._nanoseconds / 1_000_000);
}
export function dateToTimestamp(date: Date): Timestamp {
  const ms = date.getTime();
  return {
    _seconds: Math.floor(ms / 1000),
    _nanoseconds: (ms % 1000) * 1_000_000,
  };
}

/** Acepta Firestore {_seconds,_nanoseconds} | {seconds,nanoseconds} | ISO string | epoch(ms|s) */
export const FlexibleTimestamp = z.preprocess((v) => {
  if (v && typeof v === "object") {
    const r: any = v as any;
    // Firestore con/ sin guion bajo
    if (typeof r.seconds === "number" && typeof r.nanoseconds === "number") {
      return { _seconds: r.seconds, _nanoseconds: r.nanoseconds };
    }
    if (
      typeof r._seconds === "number" &&
      typeof r._nanoseconds === "number"
    ) {
      return { _seconds: r._seconds, _nanoseconds: r._nanoseconds };
    }
  }
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return dateToTimestamp(d);
  }
  if (typeof v === "number") {
    const secs = v > 2_000_000_000 ? Math.floor(v / 1000) : Math.floor(v);
    const ns = v > 2_000_000_000 ? (v % 1000) * 1_000_000 : 0;
    return { _seconds: secs, _nanoseconds: ns };
  }
  return v;
}, TimestampSchema);
