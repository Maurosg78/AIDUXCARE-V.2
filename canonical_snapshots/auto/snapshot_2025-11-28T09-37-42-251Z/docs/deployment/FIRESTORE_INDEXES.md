# Firestore Indexes Required

## Treatment Plans Collection

The `treatment_plans` collection requires a composite index for querying by `patientId` and `acceptedAt`.

### Index Details:
- **Collection:** `treatment_plans`
- **Fields:**
  1. `patientId` (Ascending)
  2. `acceptedAt` (Descending)

### Create Index:
Click the link provided in the error message, or create manually in Firebase Console:

1. Go to Firebase Console → Firestore → Indexes
2. Click "Create Index"
3. Collection ID: `treatment_plans`
4. Add fields:
   - `patientId` (Ascending)
   - `acceptedAt` (Descending)
5. Click "Create"

### Alternative: Use firestore.indexes.json

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "treatment_plans",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "patientId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "acceptedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy with: `firebase deploy --only firestore:indexes`

