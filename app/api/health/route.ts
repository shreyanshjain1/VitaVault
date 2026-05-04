import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDeploymentReadinessSummary } from "@/lib/deployment-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthCheckResult = {
  name: string;
  status: "ok" | "warning" | "error";
  detail: string;
};

async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    await db.$queryRaw`SELECT 1`;
    return { name: "database", status: "ok", detail: "Prisma database ping succeeded." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return { name: "database", status: "error", detail: message };
  }
}

function checkRedis(): HealthCheckResult {
  if (process.env.REDIS_URL?.trim()) {
    return { name: "redis", status: "ok", detail: "REDIS_URL is configured for queue-backed workflows." };
  }
  return { name: "redis", status: "warning", detail: "REDIS_URL is not configured. Worker-backed jobs will be degraded." };
}

function checkEmail(): HealthCheckResult {
  if (process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim()) {
    return { name: "email", status: "ok", detail: "Email delivery variables are configured." };
  }
  return { name: "email", status: "warning", detail: "Email delivery is not fully configured." };
}

function checkAi(): HealthCheckResult {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return { name: "ai", status: "ok", detail: "AI insight generation key is configured." };
  }
  return { name: "ai", status: "warning", detail: "OPENAI_API_KEY is missing. AI features should use fallback/demo behavior." };
}

export async function GET() {
  const readiness = getDeploymentReadinessSummary();
  const checks = [await checkDatabase(), checkRedis(), checkEmail(), checkAi()];
  const hasError = checks.some((check) => check.status === "error") || readiness.blockingIssues.length > 0;
  const hasWarning = checks.some((check) => check.status === "warning") || readiness.warningIssues.length > 0;

  const body = {
    status: hasError ? "error" : hasWarning ? "warning" : "ok",
    service: "VitaVault",
    timestamp: new Date().toISOString(),
    readiness: {
      score: readiness.score,
      requiredConfigured: readiness.requiredConfigured,
      requiredTotal: readiness.requiredTotal,
      recommendedConfigured: readiness.recommendedConfigured,
      recommendedTotal: readiness.recommendedTotal,
      blockingKeys: readiness.blockingIssues.map((issue) => issue.key),
      warningKeys: readiness.warningIssues.map((issue) => issue.key),
    },
    checks,
  };

  return NextResponse.json(body, { status: hasError ? 503 : 200 });
}
