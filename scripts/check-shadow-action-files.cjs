#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const suspicious = [];
const bannedNames = new Set([
  "app_actions_fixed.ts",
  "actions copy.ts",
  "actions copy.tsx",
]);
const bannedDirRegexes = [/^phase\d+_patch$/i, /^patch$/i, /^tmp$/i];
const bannedFileRegexes = [/\.tmp$/i, /\.bak$/i, /\.orig$/i, /\.rej$/i, / copy\.(ts|tsx)$/i];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (["node_modules", ".git", ".next"].includes(entry.name)) continue;
    if (entry.isDirectory()) {
      if (bannedDirRegexes.some((rx) => rx.test(entry.name))) {
        suspicious.push(path.relative(root, full) + path.sep);
      }
      walk(full);
      continue;
    }
    if (bannedNames.has(entry.name) || bannedFileRegexes.some((rx) => rx.test(entry.name))) {
      suspicious.push(path.relative(root, full));
    }
  }
}

walk(root);

if (suspicious.length) {
  console.error("[actions:shadow] Remove these patch/temp/shadow files before pushing:");
  for (const item of suspicious) console.error(` - ${item}`);
  process.exit(1);
}

console.log("[actions:shadow] OK. No shadow action files or patch/temp leftovers detected.");
