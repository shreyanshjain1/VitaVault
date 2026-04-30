# Patch 14 — Health Trends Analytics

## Summary

Adds a protected `/trends` workspace that turns existing VitaVault records into a longitudinal health analytics surface.

## Added

- Health Trends page at `/trends`
- Data coverage score across vitals, labs, symptoms, medication logs, and appointments
- Risk score from abnormal labs, unresolved severe symptoms, medication misses, and vital warnings
- Vitals trend cards with latest value, previous value, delta, direction, tone, and message
- 30-day vital averages
- 90-day lab flag breakdown
- Symptom severity and unresolved symptom review
- 30-day medication adherence signal
- Recent health timeline merging vitals, labs, and symptoms
- Recommended review notes from recent data
- Sidebar navigation entry

## Safety

- No Prisma migration required
- No new database tables
- No risky admin or auth changes
- Read-only analytics layer using existing records
