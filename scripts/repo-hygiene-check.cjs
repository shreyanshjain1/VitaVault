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

const blockedNames = [
  "phase03_patch",
];

const blockedDirMatchers = [
  /^phase\d+[a-z]?_patch$/i,
];

const blockedFileMatchers = [
  /\.tmp$/i,
  /\.orig$/i,
  /\.rej$/i,
];

const findings = [];

function shouldSkipDir(name) {
  return ignoredDirs.has(name);
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
        findings.push({
          type: "directory",
          path: relativePath,
          reason: "temporary patch directory should not be committed",
        });
        continue;
      }

      visit(fullPath);
      continue;
    }

    if (blockedFileMatchers.some((matcher) => matcher.test(entry.name))) {
      findings.push({
        type: "file",
        path: relativePath,
        reason: "temporary or merge-leftover file should not be committed",
      });
    }
  }
}

visit(root);

if (findings.length) {
  console.error("Repository hygiene check failed.\n");
  for (const finding of findings) {
    console.error(`- [${finding.type}] ${finding.path}: ${finding.reason}`);
  }
  console.error(
    "\nDelete the files/folders above before building or pushing."
  );
  process.exit(1);
}

console.log("Repository hygiene check passed.");
