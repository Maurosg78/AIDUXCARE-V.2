export async function fetchPendingNotes(_orgId?: string, _limit?: number|string): Promise<any[]> {
  const limit = typeof _limit==="string" ? parseInt(_limit,10) : _limit; void limit;
  return [];
}