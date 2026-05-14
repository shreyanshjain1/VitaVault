export type DeploymentTone = "success" | "warning" | "danger" | "neutral";

export type DeploymentCheckCategory = "required" | "recommended" | "optional";

export type DeploymentCheck = {
  key: string;
  label: string;
  category: DeploymentCheckCategory;
  configured: boolean;
  tone: DeploymentTone;
  detail: string;
  safeValue?: string;
  requiredForDemo?: boolean;
  featureArea:
    | "core"
    | "auth"
    | "jobs"
    | "email"
    | "ai"
    | "storage"
    | "monitoring";
};

export type DeploymentMode =
  | "production-ready"
  | "review-ready"
  | "local-development"
  | "blocked";

export type DeploymentReadinessSummary = {
  mode: DeploymentMode;
  score: number;
  requiredTotal: number;
  requiredConfigured: number;
  recommendedTotal: number;
  recommendedConfigured: number;
  optionalTotal: number;
  optionalConfigured: number;
  blockingIssues: DeploymentCheck[];
  warningIssues: DeploymentCheck[];
  demoBlockingIssues: DeploymentCheck[];
  checks: DeploymentCheck[];
  guidance: string[];
};

export type DemoReadinessCheck = {
  key: string;
  label: string;
  ready: boolean;
  tone: DeploymentTone;
  detail: string;
};

export type DemoReadinessSummary = {
  ready: boolean;
  score: number;
  checks: DemoReadinessCheck[];
  blocking: DemoReadinessCheck[];
  guidance: string[];
};

function hasValue(value: string | undefined | null) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEnvValue(value: string | undefined | null) {
  return String(value ?? "").trim();
}

function isPlaceholder(value: string | undefined | null) {
  if (!hasValue(value)) return true;
  const normalized = normalizeEnvValue(value).toLowerCase();
  return (
    normalized.includes("change-this") ||
    normalized.includes("example.com") ||
    normalized.includes("user:password") ||
    normalized.includes("db_name") ||
    normalized.includes("your-") ||
    normalized.includes("replace-me") ||
    normalized.includes("placeholder")
  );
}

function safeEnvValue(key: string, value: string | undefined | null) {
  if (!hasValue(value)) return "Not configured";
  if (isPlaceholder(value)) return "Placeholder value";

  if (key.includes("SECRET") || key.includes("KEY") || key.includes("TOKEN")) {
    return "Configured secret";
  }

  if (key === "DATABASE_URL") {
    return "Configured database URL";
  }

  const trimmed = normalizeEnvValue(value);
  if (trimmed.length <= 42) return trimmed;
  return `${trimmed.slice(0, 24)}…${trimmed.slice(-10)}`;
}

function buildCheck(
  category: DeploymentCheckCategory,
  key: string,
  label: string,
  detail: string,
  featureArea: DeploymentCheck["featureArea"],
  requiredForDemo = false,
): DeploymentCheck {
  const value = process.env[key];
  const configured = hasValue(value) && !isPlaceholder(value);
  const missingDetail =
    category === "required"
      ? `${detail} This value is required before production deployment.`
      : category === "recommended"
        ? `${detail} The app can run without it, but the related feature will be degraded or disabled.`
        : detail;

  return {
    key,
    label,
    category,
    configured,
    requiredForDemo,
    featureArea,
    tone: configured
      ? "success"
      : category === "required" || requiredForDemo
        ? "danger"
        : category === "recommended"
          ? "warning"
          : "neutral",
    detail: configured ? detail : missingDetail,
    safeValue: safeEnvValue(key, value),
  };
}

function checkRequired(
  key: string,
  label: string,
  detail: string,
  featureArea: DeploymentCheck["featureArea"],
  requiredForDemo = false,
) {
  return buildCheck(
    "required",
    key,
    label,
    detail,
    featureArea,
    requiredForDemo,
  );
}

function checkRecommended(
  key: string,
  label: string,
  detail: string,
  featureArea: DeploymentCheck["featureArea"],
) {
  return buildCheck("recommended", key, label, detail, featureArea);
}

function checkOptional(
  key: string,
  label: string,
  detail: string,
  featureArea: DeploymentCheck["featureArea"],
) {
  return buildCheck("optional", key, label, detail, featureArea);
}

export function getDeploymentChecks(): DeploymentCheck[] {
  return [
    checkRequired(
      "DATABASE_URL",
      "Database URL",
      "PostgreSQL connection used by Prisma, records, auth, and reporting.",
      "core",
      true,
    ),
    checkRequired(
      "AUTH_SECRET",
      "Auth secret",
      "Long random secret used by Auth.js session encryption and signing.",
      "auth",
      true,
    ),
    checkRequired(
      "NEXTAUTH_URL",
      "Public auth URL",
      "Canonical app URL used by Auth.js callbacks and redirects.",
      "auth",
    ),
    checkRequired(
      "APP_URL",
      "Application URL",
      "Base URL used by emails, links, and product-facing workflows.",
      "core",
    ),
    checkRecommended(
      "REDIS_URL",
      "Redis URL",
      "Redis connection used by BullMQ workers, reminders, alerts, and queue-backed features.",
      "jobs",
    ),
    checkRecommended(
      "INTERNAL_API_SECRET",
      "Internal API secret",
      "Secret used to protect internal job dispatch and worker-facing endpoints.",
      "jobs",
    ),
    checkRecommended(
      "RESEND_API_KEY",
      "Resend API key",
      "Email delivery key used by verification, invites, and outbound notifications.",
      "email",
    ),
    checkRecommended(
      "RESEND_FROM_EMAIL",
      "Email sender",
      "Verified sender identity for outbound email workflows.",
      "email",
    ),
    checkRecommended(
      "OPENAI_API_KEY",
      "OpenAI API key",
      "Enables AI insight generation. Without it, AI pages should remain in fallback/demo mode.",
      "ai",
    ),
    checkRecommended(
      "DOCUMENT_STORAGE_MODE",
      "Document storage mode",
      "Selects the document storage provider. Local storage is fine for local development.",
      "storage",
    ),
    checkRecommended(
      "PRIVATE_UPLOAD_DIR",
      "Private upload directory",
      "Local private document upload path used by the default storage provider.",
      "storage",
    ),
    checkOptional(
      "HEALTHCHECK_URL",
      "Healthcheck URL",
      "Optional URL used by local scripts to check a running deployment.",
      "monitoring",
    ),
  ];
}

function getReadinessGuidance(
  summary: Omit<DeploymentReadinessSummary, "guidance">,
) {
  if (summary.blockingIssues.length > 0) {
    return [
      "Configure required production environment variables before promoting this deployment.",
      "Run `npm run db:validate:ci` and `npx prisma migrate deploy` against the intended database before launch.",
      "Keep the public demo routes available for reviewers while production-only integrations are being configured.",
    ];
  }

  if (summary.warningIssues.length > 0) {
    return [
      "Core app configuration is ready, but recommended integrations should be completed before a full production launch.",
      "Features tied to missing recommended services should show fallback or degraded-mode messaging.",
      "Run the full local check suite before opening a deployment PR.",
    ];
  }

  return [
    "Required and recommended deployment configuration is complete.",
    "Run smoke tests against `/api/health`, `/demo`, `/login`, and the authenticated dashboard after deployment.",
    "Rotate secrets and verify production database backups before handling real patient data.",
  ];
}

function resolveDeploymentMode(
  requiredConfigured: number,
  requiredTotal: number,
  recommendedConfigured: number,
  recommendedTotal: number,
  demoBlockingIssues: DeploymentCheck[],
): DeploymentMode {
  if (
    requiredConfigured === requiredTotal &&
    recommendedConfigured === recommendedTotal
  )
    return "production-ready";
  if (requiredConfigured === requiredTotal) return "review-ready";
  if (demoBlockingIssues.length === 0) return "local-development";
  return "blocked";
}

export function getDeploymentReadinessSummary(): DeploymentReadinessSummary {
  const checks = getDeploymentChecks();
  const required = checks.filter((check) => check.category === "required");
  const recommended = checks.filter(
    (check) => check.category === "recommended",
  );
  const optional = checks.filter((check) => check.category === "optional");
  const requiredConfigured = required.filter(
    (check) => check.configured,
  ).length;
  const recommendedConfigured = recommended.filter(
    (check) => check.configured,
  ).length;
  const optionalConfigured = optional.filter(
    (check) => check.configured,
  ).length;
  const blockingIssues = required.filter((check) => !check.configured);
  const warningIssues = recommended.filter((check) => !check.configured);
  const demoBlockingIssues = checks.filter(
    (check) => check.requiredForDemo && !check.configured,
  );
  const score = Math.round(
    ((requiredConfigured * 2 + recommendedConfigured) /
      Math.max(1, required.length * 2 + recommended.length)) *
      100,
  );

  const summaryWithoutGuidance = {
    mode: resolveDeploymentMode(
      requiredConfigured,
      required.length,
      recommendedConfigured,
      recommended.length,
      demoBlockingIssues,
    ),
    score,
    requiredTotal: required.length,
    requiredConfigured,
    recommendedTotal: recommended.length,
    recommendedConfigured,
    optionalTotal: optional.length,
    optionalConfigured,
    blockingIssues,
    warningIssues,
    demoBlockingIssues,
    checks,
  };

  return {
    ...summaryWithoutGuidance,
    guidance: getReadinessGuidance(summaryWithoutGuidance),
  };
}

function getBooleanEnv(key: string) {
  const value = normalizeEnvValue(process.env[key]).toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function getDemoReadinessSummary(): DemoReadinessSummary {
  const deployment = getDeploymentReadinessSummary();
  const demoModeEnabled =
    getBooleanEnv("VITAVAULT_DEMO_MODE") ||
    getBooleanEnv("NEXT_PUBLIC_DEMO_MODE") ||
    process.env.NODE_ENV !== "production";

  const checks: DemoReadinessCheck[] = [
    {
      key: "demo-mode",
      label: "Demo mode fallback",
      ready: demoModeEnabled,
      tone: demoModeEnabled ? "success" : "warning",
      detail: demoModeEnabled
        ? "Demo-mode fallback is available for reviewer-friendly public routes."
        : "Demo routes can still render static content, but explicit demo-mode fallback is not enabled.",
    },
    {
      key: "database-minimum",
      label: "Database minimum",
      ready: deployment.demoBlockingIssues.every(
        (issue) => issue.key !== "DATABASE_URL",
      ),
      tone: deployment.demoBlockingIssues.some(
        (issue) => issue.key === "DATABASE_URL",
      )
        ? "danger"
        : "success",
      detail:
        "A valid DATABASE_URL is needed for authenticated workflows, Prisma validation, and health checks.",
    },
    {
      key: "auth-minimum",
      label: "Auth minimum",
      ready: deployment.demoBlockingIssues.every(
        (issue) => issue.key !== "AUTH_SECRET",
      ),
      tone: deployment.demoBlockingIssues.some(
        (issue) => issue.key === "AUTH_SECRET",
      )
        ? "danger"
        : "success",
      detail:
        "A valid AUTH_SECRET prevents broken login/session behavior during reviewer testing.",
    },
    {
      key: "static-demo-routes",
      label: "Static demo routes",
      ready: true,
      tone: "success",
      detail:
        "The `/demo` route family is designed as read-only showcase content and should remain accessible without seeded patient accounts.",
    },
  ];

  const blocking = checks.filter(
    (check) => !check.ready && check.tone === "danger",
  );
  const readyCount = checks.filter((check) => check.ready).length;

  return {
    ready: blocking.length === 0,
    score: Math.round((readyCount / checks.length) * 100),
    checks,
    blocking,
    guidance:
      blocking.length > 0
        ? [
            "Configure the minimum database and auth variables before asking reviewers to test authenticated workflows.",
            "Use public `/demo` routes for portfolio review while production services are incomplete.",
          ]
        : [
            "Reviewer demo readiness is acceptable.",
            "Verify `/demo`, `/api/health`, and login redirects after each deployment.",
          ],
  };
}

export function getSanitizedDeploymentEnvironment() {
  return getDeploymentChecks().map((check) => ({
    key: check.key,
    label: check.label,
    category: check.category,
    configured: check.configured,
    safeValue: check.safeValue,
    featureArea: check.featureArea,
  }));
}
