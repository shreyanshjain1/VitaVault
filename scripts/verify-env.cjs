const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

const cwd = process.cwd();
const envPath = path.join(cwd, '.env');
const fileEnv = parseEnvFile(envPath);
const mergedEnv = { ...fileEnv, ...process.env };
const isVercel = String(mergedEnv.VERCEL || '').toLowerCase() === '1' || String(mergedEnv.VERCEL || '').toLowerCase() === 'true';
const isProduction = String(mergedEnv.NODE_ENV || '').toLowerCase() === 'production' || isVercel;

const missingRequired = [];
const warnings = [];

function hasValue(name) {
  return typeof mergedEnv[name] === 'string' && mergedEnv[name].trim().length > 0;
}

function requireEnv(name, reason) {
  if (!hasValue(name)) {
    missingRequired.push(`${name} — ${reason}`);
  }
}

function warnEnv(name, reason) {
  if (!hasValue(name)) {
    warnings.push(`${name} — ${reason}`);
  }
}

requireEnv('DATABASE_URL', 'required by Prisma and all database-backed pages/routes.');
requireEnv('AUTH_SECRET', 'required by Auth.js / NextAuth session signing.');

if (isProduction) {
  requireEnv('REDIS_URL', 'required by BullMQ / jobs pages and workers in production deployments.');
  warnEnv('NEXTAUTH_URL', 'recommended in production so auth callbacks and absolute URLs stay consistent.');
  if (!hasValue('AUTH_TRUST_HOST')) {
    warnings.push('AUTH_TRUST_HOST — recommended to set to true on Vercel so Auth.js trusts the deployment host.');
  }
}

warnEnv('OPENAI_API_KEY', 'optional, but AI insight features will be disabled without it.');
warnEnv('OPENAI_MODEL', 'optional, defaults may work, but pinning a model is safer for production.');

if (missingRequired.length > 0) {
  console.error('\nEnvironment validation failed.\n');
  console.error('Missing required variables:');
  for (const item of missingRequired) {
    console.error(`- ${item}`);
  }

  console.error('\nSet them in one of these places before building/deploying:');
  console.error('- local development: project-root .env');
  console.error('- Vercel: Project Settings -> Environment Variables');

  console.error('\nExample values:');
  console.error('DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"');
  console.error('AUTH_SECRET="your-long-random-secret"');
  console.error('REDIS_URL="redis://HOST:6379"');
  console.error('NEXTAUTH_URL="https://your-project.vercel.app"');
  console.error('AUTH_TRUST_HOST="true"');
  process.exit(1);
}

console.log('Environment validation passed.');

if (warnings.length > 0) {
  console.warn('\nEnvironment warnings:');
  for (const item of warnings) {
    console.warn(`- ${item}`);
  }
}
