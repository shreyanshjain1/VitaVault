# Patch 52 Hotfix: Report Builder Syntax

This hotfix removes two accidental object-style return fields from the `Promise.all` destructuring block in `lib/report-builder.ts`.

## Problem

`lib/report-builder.ts` accidentally contained these invalid destructuring entries inside an array destructure:

```ts
savedReports: savedReports.map(mapSavedReportToHistoryItem),
savedReportStats: summarizeSavedReportStats(savedReports),
```

That created TypeScript parser errors even though the migration and unit tests were otherwise healthy.

## Fix

The hotfix keeps `savedReports` as the real Prisma query result in the `Promise.all` block and maps/summarizes it later inside the returned object:

```ts
savedReports: savedReports.map(mapSavedReportToHistoryItem),
savedReportStats: summarizeSavedReportStats(savedReports),
```

## Safety

- No Prisma schema changes
- No migration changes
- No package changes
- No test logic changes
- Fixes syntax only
