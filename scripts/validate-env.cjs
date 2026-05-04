#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = process.cwd();

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const output = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    output[key] = value;
  }
  return output;
}

const env = {
  ...parseEnvFile(path.join(root, ".env")),
  ...parseEnvFile(path.join(root, ".env.local")),
  ...process.env,
};

function hasValue(key) {
  return typeof env[key] === "string" && env[key].trim().length > 0;
}

function isPlaceholder(key) {
  if (!hasValue(key)) return true;
  const value = env[key].toLowerCase();
  return value.includes("change-this") || value.includes("example.com") || value.includes("user:password") || value.includes("db_name");
}

const required = [
  ["DATABASE_URL", "PostgreSQL connection used by Prisma."],
  ["AUTH_SECRET", "Auth.js secret used for session signing/encryption."],
  ["NEXTAUTH_URL", "Public app URL used by auth callbacks."],
  ["APP_URL", "Base URL used by emails and app links."],
];

const recommended = [
  ["REDIS_URL", "Queue and worker workflows."],
  ["INTERNAL_API_SECRET", "Internal job dispatch/API protection."],
  ["RESEND_API_KEY", "Outbound email delivery."],
  ["RESEND_FROM_EMAIL", "Verified email sender."],
  ["OPENAI_API_KEY", "AI insight generation."],
  ["DOCUMENT_STORAGE_MODE", "Document storage provider selection."],
  ["PRIVATE_UPLOAD_DIR", "Local private upload directory."],
];

const missingRequired = required.filter(([key]) => isPlaceholder(key));
const missingRecommended = recommended.filter(([key]) => isPlaceholder(key));

console.log("\nVitaVault environment check\n");
for (const [key, detail] of required) {
  console.log(`${isPlaceholder(key) ? "✗" : "✓"} ${key} - ${detail}`);
}
for (const [key, detail] of recommended) {
  console.log(`${isPlaceholder(key) ? "!" : "✓"} ${key} - ${detail}`);
}

if (missingRecommended.length) {
  console.log("\nWarnings:");
  for (const [key, detail] of missingRecommended) console.log(`- ${key}: ${detail}`);
}

if (missingRequired.length) {
  console.error("\nBlocking issues:");
  for (const [key, detail] of missingRequired) console.error(`- ${key}: ${detail}`);
  process.exit(1);
}

console.log("\nEnvironment check passed for required deployment variables.\n");
