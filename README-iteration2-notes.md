# VitaVault Iteration 2 Notes

This patch adds:

- Threshold-based alert engine
- Alert rule + alert event + alert audit models
- BullMQ + Redis worker runtime for alert evaluation
- Care-team visibility controls for rules and events
- Alert list page, filter bar, detail page, and status actions
- Scheduled scan script and internal queueing endpoints

## Hook points you should wire into existing create/update flows

After saving any new record, call:

```ts
import { enqueueThresholdAlertEvaluation } from "@/lib/alerts/source";
```

Examples:

### After a new vital record is created
```ts
await enqueueThresholdAlertEvaluation({
  userId,
  sourceType: "VITAL_RECORD",
  sourceId: vital.id,
  sourceRecordedAt: vital.recordedAt,
  initiatedBy: "record_create",
});
```

### After a new symptom entry is created
```ts
await enqueueThresholdAlertEvaluation({
  userId,
  sourceType: "SYMPTOM_ENTRY",
  sourceId: symptom.id,
  sourceRecordedAt: symptom.startedAt,
  initiatedBy: "record_create",
});
```

### After a medication log is created
```ts
await enqueueThresholdAlertEvaluation({
  userId,
  sourceType: "MEDICATION_LOG",
  sourceId: log.id,
  sourceRecordedAt: log.loggedAt,
  initiatedBy: "record_create",
});
```

### After a sync job finishes or device ingestion completes
```ts
await enqueueThresholdAlertEvaluation({
  userId,
  sourceType: "SYNC_JOB",
  sourceId: syncJob.id,
  sourceRecordedAt: syncJob.finishedAt ?? new Date(),
  initiatedBy: "sync_finish",
});
```

## Local setup

```bash
npm install
npx prisma migrate dev --name add_threshold_alert_engine
npm run worker
npm run dev
```

## Scheduled scans

```bash
npm run alerts:scan
```
