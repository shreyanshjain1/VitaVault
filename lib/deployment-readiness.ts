export type DeploymentTone = "success" | "warning" | "danger" | "neutral";

export type DeploymentCheck = {
  key: string;
  label: string;
  category: "required" | "recommended" | "optional";
  configured: boolean;
  tone: DeploymentTone;
  detail: string;
};

function hasValue(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlaceholder(value: string | undefined | null) {
  if (!hasValue(value)) return true;
  const normalized = String(value).toLowerCase();
  return normalized.includes("change-this") || normalized.includes("example.com") || normalized.includes("user:password") || normalized.includes("db_name");
}

function checkRequired(key: string, label: string, detail: string): DeploymentCheck {
  const value = process.env[key];
  const configured = hasValue(value) && !isPlaceholder(value);
  return {
    key,
    label,
    category: "required",
    configured,
    tone: configured ? "success" : "danger",
    detail: configured ? detail : `${detail} This value is required before production deployment.`,
  };
}

function checkRecommended(key: string, label: string, detail: string): DeploymentCheck {
  const value = process.env[key];
  const configured = hasValue(value) && !isPlaceholder(value);
  return {
    key,
    label,
    category: "recommended",
    configured,
    tone: configured ? "success" : "warning",
    detail: configured ? detail : `${detail} The app can run without it, but the related feature will be degraded or disabled.`,
  };
}

function checkOptional(key: string, label: string, detail: string): DeploymentCheck {
  const value = process.env[key];
  const configured = hasValue(value) && !isPlaceholder(value);
  return {
    key,
    label,
    category: "optional",
    configured,
    tone: configured ? "success" : "neutral",
    detail,
  };
}

export function getDeploymentChecks(): DeploymentCheck[] {
  return [
    checkRequired("DATABASE_URL", "Database URL", "PostgreSQL connection used by Prisma, records, auth, and reporting."),
    checkRequired("AUTH_SECRET", "Auth secret", "Long random secret used by Auth.js session encryption and signing."),
    checkRequired("NEXTAUTH_URL", "Public auth URL", "Canonical app URL used by Auth.js callbacks and redirects."),
    checkRequired("APP_URL", "Application URL", "Base URL used by emails, links, and product-facing workflows."),
    checkRecommended("REDIS_URL", "Redis URL", "Redis connection used by BullMQ workers, reminders, alerts, and queue-backed features."),
    checkRecommended("INTERNAL_API_SECRET", "Internal API secret", "Secret used to protect internal job dispatch and worker-facing endpoints."),
    checkRecommended("RESEND_API_KEY", "Resend API key", "Email delivery key used by verification, invites, and outbound notifications."),
    checkRecommended("RESEND_FROM_EMAIL", "Email sender", "Verified sender identity for outbound email workflows."),
    checkRecommended("OPENAI_API_KEY", "OpenAI API key", "Enables AI insight generation. Without it, AI pages should remain in fallback/demo mode."),
    checkRecommended("DOCUMENT_STORAGE_MODE", "Document storage mode", "Selects the document storage provider. Local storage is fine for local development."),
    checkRecommended("PRIVATE_UPLOAD_DIR", "Private upload directory", "Local private document upload path used by the default storage provider."),
    checkOptional("HEALTHCHECK_URL", "Healthcheck URL", "Optional URL used by local scripts to check a running deployment."),
  ];
}

export function getDeploymentReadinessSummary() {
  const checks = getDeploymentChecks();
  const required = checks.filter((check) => check.category === "required");
  const recommended = checks.filter((check) => check.category === "recommended");
  const requiredConfigured = required.filter((check) => check.configured).length;
  const recommendedConfigured = recommended.filter((check) => check.configured).length;
  const score = Math.round(((requiredConfigured * 2 + recommendedConfigured) / Math.max(1, required.length * 2 + recommended.length)) * 100);

  return {
    score,
    requiredTotal: required.length,
    requiredConfigured,
    recommendedTotal: recommended.length,
    recommendedConfigured,
    blockingIssues: required.filter((check) => !check.configured),
    warningIssues: recommended.filter((check) => !check.configured),
    checks,
  };
}
