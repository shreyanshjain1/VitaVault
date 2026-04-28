#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const actionsPath = path.join(root, "app", "actions.ts");

if (!fs.existsSync(actionsPath)) {
  console.error("[actions:imports] Missing app/actions.ts");
  process.exit(1);
}

const ignoredDirs = new Set(["node_modules", ".git", ".next", "coverage", "dist"]);
const ignoredPathPatterns = [
  /\\phase\d+_patch\\/i,
  /\/phase\d+_patch\//i,
  /\.tmp$/i,
  /\.bak$/i,
  /\.orig$/i,
  /\.rej$/i,
  / copy\.(ts|tsx)$/i,
];

function shouldIgnore(filePath) {
  return ignoredPathPatterns.some((rx) => rx.test(filePath));
}

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    if (shouldIgnore(full)) continue;

    if (entry.isDirectory()) {
      walk(full, results);
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }

  return results;
}

function getExportedActionNames(source) {
  const exported = new Set();

  for (const match of source.matchAll(/export\s+async\s+function\s+(\w+)/g)) {
    exported.add(match[1]);
  }

  for (const match of source.matchAll(/export\s+(?:const|let|var)\s+(\w+)\s*=/g)) {
    exported.add(match[1]);
  }

  return exported;
}

function parseNamedImports(importBlock) {
  return importBlock
    .split(",")
    .map((part) => part.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").trim())
    .filter(Boolean)
    .map((part) => part.replace(/^type\s+/, "").replace(/\s+as\s+\w+$/, "").trim())
    .filter(Boolean);
}

const actionsSource = fs.readFileSync(actionsPath, "utf8");
const exported = getExportedActionNames(actionsSource);
const files = walk(path.join(root, "app"));
const problems = [];
const checkedImports = [];

// Keep the import block bounded to a single named import declaration. The previous
// pattern could accidentally jump across earlier imports until it found
// `from "@/app/actions"`, producing false positives from date-fns, lucide-react,
// component imports, and other modules.
const actionImportRegex = /import\s*\{([^}]*)\}\s*from\s*["']@\/app\/actions["']\s*;?/g;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");

  for (const match of src.matchAll(actionImportRegex)) {
    const names = parseNamedImports(match[1]);
    checkedImports.push({ file: path.relative(root, file), names });

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

const importCount = checkedImports.reduce((total, item) => total + item.names.length, 0);
console.log(
  `[actions:imports] OK. Checked ${importCount} imported action(s) across ${checkedImports.length} file(s).`,
);
