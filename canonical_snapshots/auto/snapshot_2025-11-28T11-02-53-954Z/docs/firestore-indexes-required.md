# Firestore Indexes Required - Critical Stability Fix

## Priority 1: treatment_plans Collection

**Index Name:** `treatment_plans_patientId_acceptedAt_name`

**Collection:** `treatment_plans`

**Fields:**
- `patientId` (Ascending)
- `acceptedAt` (Ascending)
- `__name__` (Ascending)

**Query Pattern:**
```typescript
query(
  collection(db, 'treatment_plans'),
  where('patientId', '==', patientId),
  where('acceptedAt', '==', true),
  orderBy('__name__')
)
```

**Firebase Console Link:**
```
https://console.firebase.google.com/v1/r/project/aiduxcare-v2-uat-dev/firestore/indexes?create_composite=Clxwcm9qZWN0cy9haWR1eGNhcmUtdjItdWF0LWRldi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdHJlYXRtZW50X3BsYW5zL2luZGV4ZXMvXxABGg0KCXBhdGllbnRJZBABGg4KCmFjY2VwdGVkQXQQAhoMCghfX25hbWVfXxAC
```

**Status:** ✅ DEPLOYED - Created via Firebase CLI on 2025-11-28

---

## Priority 2: episodes Collection

**Index Name:** `episodes_patientId_admissionDate_name`

**Collection:** `episodes`

**Fields:**
- `patientId` (Ascending)
- `dates.admissionDate` (Descending)
- `__name__` (Ascending)

**Query Pattern:**
```typescript
query(
  collection(db, 'episodes'),
  where('patientId', '==', patientId),
  orderBy('dates.admissionDate', 'desc'),
  orderBy('__name__'),
  limit(1)
)
```

**Firebase Console Link:**
```
https://console.firebase.google.com/v1/r/project/aiduxcare-v2-uat-dev/firestore/indexes?create_composite=Clxwcm9qZWN0cy9haWR1eGNhcmUtdjItdWF0LWRldi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZXBpc29kZXMvaW5kZXhlcy9fEAEaDQoJcGF0aWVudElkEAEaGgoYZGF0ZXMuYWRtaXNzaW9uRGF0ZRABGgwKCF9fbmFtZV9fEAI
```

**Status:** ✅ DEPLOYED - Created via Firebase CLI on 2025-11-28

---

## Implementation Instructions

### Option 1: Firebase Console (Recommended)

1. Click on the Firebase Console links above
2. Review the index configuration
3. Click "Create Index"
4. Wait for index to build (usually 1-5 minutes)

### Option 2: firestore.indexes.json

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
          "order": "ASCENDING"
        },
        {
          "fieldPath": "__name__",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "episodes",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "patientId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "dates.admissionDate",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "__name__",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

---

## Verification

After creating indexes, verify they exist:

1. Go to Firebase Console > Firestore > Indexes
2. Search for `treatment_plans` and `episodes`
3. Confirm both indexes show "Enabled" status
4. Test queries in application - should no longer show index errors

---

**Last Updated:** 2025-11-28
**Priority:** CRITICAL - Required for application stability

