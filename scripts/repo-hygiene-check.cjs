#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();

const ignoredDirs = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "out",
]);

const blockedNames = ["phase03_patch"];

const blockedDirMatchers = [/^phase\d+[a-z]?_patch$/i];

const blockedFileMatchers = [/\.tmp$/i, /\.orig$/i, /\.rej$/i];

const blockedRootFiles = new Map([
  [
    "actions.ts",
    "stale root-level server action copy; use app/care-team/actions.ts instead",
  ],
  [
    "invite-email.ts",
    "stale root-level invite email helper copy; use lib/invite-email.ts instead",
  ],
]);

const canonicalSourceFiles = new Map([
  ["actions.ts", "app/care-team/actions.ts"],
  ["invite-email.ts", "lib/invite-email.ts"],
]);

const findings = [];

function shouldSkipDir(name) {
  return ignoredDirs.has(name);
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function addFinding(type, relativePath, reason) {
  findings.push({ type, path: relativePath, reason });
}

function checkRootDuplicateSources() {
  for (const [fileName, reason] of blockedRootFiles.entries()) {
    if (!fileExists(fileName)) continue;

    const canonicalPath = canonicalSourceFiles.get(fileName);
    const canonicalHint = canonicalPath && fileExists(canonicalPath)
      ? ` Canonical source exists at ${canonicalPath}.`
      : " Canonical source was not found; inspect before deleting.";

    addFinding("file", fileName, `${reason}.${canonicalHint}`);
  }
}

function visit(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(root, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;

      if (
        blockedNames.includes(entry.name) ||
        blockedDirMatchers.some((matcher) => matcher.test(entry.name))
      ) {
        addFinding(
          "directory",
          relativePath,
          "temporary patch directory should not be committed",
        );
        continue;
      }

      visit(fullPath);
      continue;
    }

    if (blockedFileMatchers.some((matcher) => matcher.test(entry.name))) {
      addFinding(
        "file",
        relativePath,
        "temporary or merge-leftover file should not be committed",
      );
    }
  }
}

checkRootDuplicateSources();
visit(root);

if (findings.length) {
  console.error("Repository hygiene check failed.\n");
  for (const finding of findings) {
    console.error(`- [${finding.type}] ${finding.path}: ${finding.reason}`);
  }
  console.error("\nDelete or move the files/folders above before building or pushing.");
  console.error("For Patch 77 cleanup, run: node scripts/cleanup-root-duplicates.cjs");
  process.exit(1);
}

console.log("Repository hygiene check passed.");
