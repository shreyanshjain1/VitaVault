import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { generateOwnAiInsightAction } from "./actions";

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default async function AiInsightsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};

  const isAiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  const [insights, sharedPatients] = await Promise.all([
    db.aiInsight.findMany({
      where: { ownerUserId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.careAccess.findMany({
      where: {
        memberUserId: user.id,
        status: "ACTIVE",
        canGenerateAIInsights: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            healthProfile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const latest = insights[0] ?? null;
  const latestFlags = parseJsonArray<{ type: string; severity: string; message: string }>(
    latest?.trendFlagsJson ?? null
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="AI Insights"
          description="Generate patient-friendly summaries, trend flags, and follow-up talking points from the records already stored in VitaVault."
          action={
            <div className="flex flex-wrap gap-3">
              <form action={generateOwnAiInsightAction}>
                <button
                  type="submit"
                  disabled={!isAiConfigured}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate new insight
                </button>
              </form>
              <Link
                href="/care-team"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Open Care Team
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Latest insight</CardTitle>
                  <CardDescription className="mt-1">
                    A concise summary + trend flags built from your stored records.
                  </CardDescription>
                </div>
                {isAiConfigured ? (
                  <StatusPill tone="success">AI configured</StatusPill>
                ) : (
                  <StatusPill tone="warning">Not configured</StatusPill>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {params.error === "quota" ? (
                <div className="mb-4 rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                  OpenAI API quota/billing is not available for this project. Add billing/credits, then retry.
                </div>
              ) : null}

              {params.error === "not_configured" ? (
                <div className="mb-4 rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                  AI is not configured. Set <span className="font-mono">OPENAI_API_KEY</span> (and optional{" "}
                  <span className="font-mono">OPENAI_MODEL</span>), then retry.
                </div>
              ) : null}

              {params.error === "general" ? (
                <div className="mb-4 rounded-3xl border border-rose-200/70 bg-rose-50/70 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
                  AI insight generation failed. Please try again.
                </div>
              ) : null}

              {params.success === "1" ? (
                <div className="mb-4 rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                  AI insight generated successfully.
                </div>
              ) : null}

              {latest ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-background/70">{latest.adherenceRisk.toUpperCase()} risk</Badge>
                    <Badge className="bg-background/70">
                      Generated: {latest.createdAt.toLocaleString()}
                    </Badge>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                    <p className="text-base font-semibold">{latest.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{latest.summary}</p>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                    <p className="text-sm font-medium">Trend flags</p>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {latestFlags.length ? (
                        latestFlags.map((flag, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-medium text-foreground/80">[{flag.severity}]</span>
                            <span>{flag.message}</span>
                          </li>
                        ))
                      ) : (
                        <li>No trend flags found.</li>
                      )}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                    <p className="text-xs text-muted-foreground">{latest.disclaimer}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-5">
                  <p className="text-sm font-medium">No AI insight yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate your first insight to produce a patient-friendly summary from your stored data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shared patients (AI allowed)</CardTitle>
              <CardDescription className="mt-1">
                Workspaces where your shared permissions allow AI generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sharedPatients.length === 0 ? (
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                  No shared patients currently allow AI generation.
                </div>
              ) : (
                sharedPatients.map((grant) => (
                  <div
                    key={grant.id}
                    className="rounded-3xl border border-border/60 bg-background/40 p-4"
                  >
                    <p className="text-sm font-medium">
                      {grant.owner.healthProfile?.fullName ?? grant.owner.name ?? "Patient"}
                    </p>
                    <p className="text-sm text-muted-foreground">{grant.owner.email}</p>
                    <Link
                      href={`/patient/${grant.owner.id}`}
                      className="mt-3 inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm font-medium hover:bg-muted/50"
                    >
                      Open workspace
                    </Link>
                  </div>
                ))
              )}

              <div className="rounded-3xl border border-border/60 bg-background/40 p-4 text-xs text-muted-foreground">
                AI insights are informational and non-diagnostic. Use them to prepare better questions for clinicians.
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Insight history</CardTitle>
            <CardDescription className="mt-1">
              Your last 12 generated insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <div className="rounded-3xl border border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                No AI insight history yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {insights.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-border/60 bg-background/40 p-5"
                  >
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">
                      {item.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="bg-background/70">
                        {item.createdAt.toLocaleString()}
                      </Badge>
                      <Badge className="bg-background/70">
                        {String(item.adherenceRisk).toUpperCase()} risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}