export function scrubFhirResource(resource: any) {
  const scrubbed = { ...resource };
  delete scrubbed.id;
  delete scrubbed.meta;
  return scrubbed;
}
