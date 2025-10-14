# Migration Guide (Legacy → Current)

## snake_case → camelCase
Before:
{"patient_id":"p001","created_at":1697040000}

After (normalized by schema):
{"patientId":"p001","createdAt":{"_seconds":1697040000,"_nanoseconds":0}}

## Actions "note.created" → "CREATE"
Before: {"action":"note.created"}
After:  {"action":"CREATE"}

## Granted aliases in Consents
accepted/consented/is_granted/value:boolean → granted (boolean)
