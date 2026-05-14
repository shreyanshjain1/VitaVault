#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();

const cleanupTargets = [
  {
    duplicate: "actions.ts",
    canonical: "app/care-team/actions.ts",
    reason: "root-level stale care-team server action copy",
  },
  {
    duplicate: "invite-email.ts",
    canonical: "lib/invite-email.ts",
    reason: "root-level stale invite email helper copy",
  },
];

const removed = [];
const skipped = [];

for (const target of cleanupTargets) {
  const duplicatePath = path.join(root, target.duplicate);
  const canonicalPath = path.join(root, target.canonical);

  if (!fs.existsSync(duplicatePath)) {
    skipped.push(`${target.duplicate} was already absent.`);
    continue;
  }

  if (!fs.existsSync(canonicalPath)) {
    skipped.push(
      `${target.duplicate} was not removed because canonical source ${target.canonical} was not found.`,
    );
    continue;
  }

  fs.unlinkSync(duplicatePath);
  removed.push(`${target.duplicate} (${target.reason}; canonical: ${target.canonical})`);
}

if (removed.length) {
  console.log("Removed stale root duplicate source files:");
  for (const item of removed) console.log(`- ${item}`);
}

if (skipped.length) {
  console.log("Skipped:");
  for (const item of skipped) console.log(`- ${item}`);
}

console.log("Cleanup complete. Run node scripts/repo-hygiene-check.cjs to verify.");
