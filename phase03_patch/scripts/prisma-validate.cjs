const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(envPath) && !process.env.DATABASE_URL) {
  fail(
    [
      "Missing .env file.",
      "Create .env in the project root before running Prisma validation.",
      'Example:',
      'DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public"',
    ].join("\n")
  );
}

let hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

if (!hasDatabaseUrl && fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  hasDatabaseUrl = envFile
    .split(/\r?\n/)
    .some((line) => line.trim().startsWith("DATABASE_URL="));
}

if (!hasDatabaseUrl) {
  fail(
    [
      "DATABASE_URL is missing.",
      "Add DATABASE_URL to your .env file or your shell environment first.",
    ].join("\n")
  );
}

const prismaBin = process.platform === "win32"
  ? path.join(cwd, "node_modules", ".bin", "prisma.cmd")
  : path.join(cwd, "node_modules", ".bin", "prisma");

const result = spawnSync(prismaBin, ["validate"], {
  stdio: "inherit",
  shell: false,
  env: process.env,
});

process.exit(result.status ?? 1);
