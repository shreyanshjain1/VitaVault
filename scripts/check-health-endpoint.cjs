#!/usr/bin/env node
const url = process.env.HEALTHCHECK_URL || process.argv[2] || "http://localhost:3000/api/health";

async function main() {
  console.log(`Checking VitaVault health endpoint: ${url}`);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  console.log(JSON.stringify(body, null, 2));
  if (!response.ok) {
    throw new Error(`Health endpoint returned HTTP ${response.status}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
