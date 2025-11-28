# Follow-up Detection Algorithm

## Overview

Multi-factor detection algorithm to differentiate follow-up visits from initial evaluations.

## Detection Factors

### Primary Indicators (70 points total)

#### 1. Recent Episode Check (40 points)
- Checks patient history for episodes within 30 days
- Uses `EpisodeService` to query recent admissions
- Calculates days since last visit
- **Scoring**: 40 points if episode found within 30 days

#### 2. Keywords in Chief Complaint (30 points)
- Detects follow-up keywords in chief complaint text
- Uses regex patterns for whole-word matching
- **Keywords**:
  - Explicit: "follow-up", "follow up", "f/u", "return visit"
  - Progress: "progress", "improvement", "worse", "same"
  - Temporal: "since last visit", "since last time"
  - Maintenance: "continuing", "ongoing", "maintenance"
- **Scoring**: Up to 30 points (10 points per keyword, max 30)

### Secondary Indicators (30 points total)

#### 3. Consultation Type Metadata (15 points)
- Checks consultation type field
- Looks for follow-up indicators in type name
- **Scoring**: 15 points if type indicates follow-up

#### 4. Provider Notes (10 points)
- Analyzes provider notes for follow-up keywords
- Uses same keyword detection as chief complaint
- **Scoring**: 10 points if keywords found

#### 5. Appointment Data (5 points)
- Checks appointment scheduling data
- Looks for follow-up indicators in reason/type
- **Scoring**: 5 points if appointment data indicates follow-up

## Confidence Scoring

### Calculation

```
Total Confidence = Primary Indicators + Secondary Indicators
```

**Maximum**: 100 points

### Thresholds

- **80%+ (80+ points)**: Automatic follow-up mode
- **60-79% (60-79 points)**: Suggest follow-up with user confirmation
- **<60% (<60 points)**: Default to initial evaluation

## Manual Override

Users can always override detection:
- **Manual Override**: Sets confidence to 100%
- **Override Type**: 'initial' or 'follow-up'
- **Audit Logged**: All overrides recorded

## Algorithm Example

### Scenario 1: High Confidence Follow-up

```
Patient History: Episode 15 days ago (+40 points)
Chief Complaint: "Follow-up visit, pain improved" (+30 points)
Consultation Type: "Follow-up" (+15 points)
Total: 85 points → Automatic follow-up mode
```

### Scenario 2: Suggested Follow-up

```
Patient History: Episode 25 days ago (+40 points)
Chief Complaint: "Progress check" (+10 points)
Total: 50 points → Suggest follow-up (60-79% threshold)
```

### Scenario 3: Initial Evaluation

```
Patient History: No recent episodes (0 points)
Chief Complaint: "New patient, back pain" (0 points)
Total: 0 points → Default to initial evaluation
```

## Implementation

### Service: `followUpDetectionService.ts`

**Main Function**: `detectFollowUp(input: FollowUpDetectionInput)`

**Returns**: `FollowUpDetectionResult` with:
- `isFollowUp`: boolean
- `confidence`: number (0-100)
- `rationale`: string[] (explanation)
- `recommendedWorkflow`: 'initial' | 'follow-up' | 'suggest-follow-up'

## Audit Trail

All detection decisions are logged:
- Detection timestamp
- Confidence score
- Rationale
- User ID
- Patient ID
- Manual override flag

## Future Improvements

1. **Machine Learning**: Train model on historical data
2. **User Feedback**: Improve accuracy based on corrections
3. **Temporal Patterns**: Learn from visit frequency
4. **Specialty-Specific**: Custom detection for different specialties

---

**Status**: ✅ Implementation Complete

**Last Updated**: November 27, 2025


