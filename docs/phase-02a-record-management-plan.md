# Phase 02A — Record Management Patch

This patch adds the first real record-lifecycle layer to VitaVault.

## Included in this patch
- Doctors: edit + delete actions
- Appointments: edit + delete actions
- Lab Results: edit + delete actions
- Documents: metadata edit + delete actions
- Upload cleanup helper for deleting local files from `/public/uploads`

## Why this phase comes next
The repo already supports record creation for these modules, but users could not properly maintain records after saving them. That made the app feel incomplete in day-to-day use.

This patch closes that gap first before moving on to the heavier modules like medications, vitals, symptoms, and vaccinations.

## Next recommended patch
Phase 02B should cover:
- Medications: edit/archive/delete + schedule updates
- Vitals: edit/delete
- Symptoms: edit/resolve/delete
- Vaccinations: edit/delete
