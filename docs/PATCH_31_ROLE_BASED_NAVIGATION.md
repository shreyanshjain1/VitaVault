# Patch 31 — Role-Based Navigation Visibility

## Summary

This patch makes VitaVault's sidebar navigation role-aware so normal users do not see administrator-only operational links.

## Problem fixed

The sidebar previously displayed the full **Admin & Ops** group to every authenticated account. Even when server-side page protection existed, exposing admin links to patient/caregiver/doctor/lab users created confusion and made the UI feel less polished.

## Changes

- Adds role visibility metadata to app route sections/items.
- Adds navigation helper functions for filtering routes by role.
- Hides the **Admin & Ops** section from non-admin accounts.
- Moves personal account security into a separate **Account** section visible to all authenticated users.
- Keeps admin-only links visible to admin accounts:
  - Audit Log
  - Admin
  - Jobs
  - Operations
  - API Docs
- Updates the app shell to derive the current user role from the NextAuth session.
- Updates sidebar/topbar copy to describe the workspace as role-aware.

## Expected behavior

### Patient / Caregiver / Doctor / Lab Staff

Visible:
- Overview
- Records
- Monitoring
- Sharing & Reports
- Account → Security

Hidden:
- Admin
- Jobs
- Operations
- Audit Log
- API Docs

### Admin

Visible:
- All normal product sections
- Account
- Admin & Ops

## Files changed

- `components/app-shell.tsx`
- `lib/app-routes.ts`
- `docs/PATCH_31_ROLE_BASED_NAVIGATION.md`

## Migration

No Prisma migration required.
