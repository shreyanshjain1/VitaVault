import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = join(
  process.cwd(),
  "prisma",
  "migrations",
  "20260505051910_add_care_notes",
  "migration.sql",
);

describe("migration safety", () => {
  it("adds Reminder.updatedAt with a default for existing rows", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain('"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP');
  });

  it("guards reminder enum creation for retry-safe local migrations", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain('CREATE TYPE "ReminderState"');
    expect(sql).toContain('CREATE TYPE "ReminderChannel"');
    expect(sql).toContain('CREATE TYPE "ReminderSourceType"');
    expect(sql).toContain("WHEN duplicate_object THEN null");
  });
});
