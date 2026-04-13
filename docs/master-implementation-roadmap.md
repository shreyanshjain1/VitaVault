# VitaVault Master Implementation Roadmap

## Order of work

### Phase 01 - Stabilize the base
- fix action typing issues
- make validation safer
- harden CI checks
- clean bootstrap migration readability

### Phase 02 - Complete core CRUD
- doctors: edit/delete
- medications: edit/archive/reactivate
- appointments: edit/cancel/complete
- labs: edit/delete
- vitals: edit/delete
- symptoms: edit/resolve/delete
- vaccinations: edit/delete
- documents: replace/delete

### Phase 03 - Complete product workflows
- finish alert detail page
- add acknowledge/resolve/dismiss notes
- improve reminder center with snooze and recurrence editing
- add care invite resend/expiry handling
- add patient timeline page

### Phase 04 - Business-grade upgrades
- patient summary PDF
- abnormal-results review queue
- admin operations page for jobs/failures/sync status
- audit log viewer filters

### Phase 05 - Real device credibility
- complete one real Android Health Connect ingestion path
- mirror readings into vitals where applicable
- connect synced readings to alert rules
- show sync health in UI
