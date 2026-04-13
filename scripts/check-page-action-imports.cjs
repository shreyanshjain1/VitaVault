#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const actionsPath = path.join(root, "app", "actions.ts");
if (!fs.existsSync(actionsPath)) {
  console.error("[actions:imports] Missing app/actions.ts");
  process.exit(1);
}

const actionsSource = fs.readFileSync(actionsPath, "utf8");
const exported = new Set([...actionsSource.matchAll(/export\s+async\s+function\s+(\w+)/g)].map((m) => m[1]));

const importRegex = /import\s*\{([\s\S]*?)\}\s*from\s*["']@\/app\/actions["']/g;
const ignoredDirs = new Set(["node_modules", ".git", ".next"]);
const ignoredPathPatterns = [
  /\\phase\d+_patch\\/i,
  /\/phase\d+_patch\//i,
  /\.tmp$/i,
  /\.bak$/i,
  /\.orig$/i,
  /\.rej$/i,
  / copy\.(ts|tsx)$/i,
];

function shouldIgnore(p) {
  return ignoredPathPatterns.some((rx) => rx.test(p));
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (shouldIgnore(full)) continue;
    if (entry.isDirectory()) walk(full, results);
    else if (/\.(ts|tsx)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const files = walk(path.join(root, "app"));
const problems = [];

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  for (const match of src.matchAll(importRegex)) {
    const names = match[1]
      .split(",")
      .map((part) => part.replace(/\s+as\s+\w+/, "").trim())
      .filter(Boolean);

    for (const name of names) {
      if (!exported.has(name)) {
        problems.push({ file: path.relative(root, file), name });
      }
    }
  }
}

if (problems.length) {
  console.error("[actions:imports] Found imports from @/app/actions that are not exported:");
  for (const p of problems) console.error(` - ${p.file}: ${p.name}`);
  process.exit(1);
}

console.log(`[actions:imports] OK. Checked ${files.length} app files against the app/actions.ts export surface.`);
