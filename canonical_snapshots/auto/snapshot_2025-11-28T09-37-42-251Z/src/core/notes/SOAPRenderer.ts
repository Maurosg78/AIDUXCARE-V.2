export function renderMarkdown(note: unknown): string {
  // TODO: implementar render real; mantener libre de PHI en logs
  return typeof note === 'string' ? note : JSON.stringify(note ?? {});
}
