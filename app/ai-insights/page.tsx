import Link from "next/link";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
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

export default async function AiInsightsPage() {
  const user = await requireUser();

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
            healthProfile: {
              select: {
                fullName: true,
              },
            },
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
      <div className="space-y-8">
        <section className="rounded-[32px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                AI Insights
              </p>
              <h1 className="mt-3 text-3xl font-semibold">Health summary assistant</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Generate patient-friendly summaries, trend flags, and follow-up talking points using the health records already stored in VitaVault.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <form action={generateOwnAiInsightAction}>
                  <button
                    type="submit"
                    className="rounded-2xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
                  >
                    Generate new insight
                  </button>
                </form>

                <Link
                  href="/care-team"
                  className="rounded-2xl border px-4 py-2.5 text-sm font-medium"
                >
                  Open Care Team
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-violet-200 bg-violet-50/80 p-5 dark:border-violet-900/50 dark:bg-violet-950/25">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-violet-600 p-2 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">AI visibility fixed</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    This page is now the main entry point for owner-generated AI insights, instead of hiding the feature only behind shared patient pages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <h2 className="text-xl font-semibold">Latest insight</h2>

            {latest ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-3xl border border-zinc-200/80 p-5 dark:border-zinc-800">
                  <p className="font-semibold">{latest.title}</p>
                  <p className="mt-2 text-sm leading-6">{latest.summary}</p>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Adherence risk: {latest.adherenceRisk}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Generated: {latest.createdAt.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-3xl border border-zinc-200/80 p-5 dark:border-zinc-800">
                  <p className="font-semibold">Trend flags</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                    {latestFlags.length ? (
                      latestFlags.map((flag, idx) => (
                        <li key={`${flag.type}-${idx}`}>
                          [{flag.severity}] {flag.message}
                        </li>
                      ))
                    ) : (
                      <li>No trend flags found.</li>
                    )}
                  </ul>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {latest.disclaimer}
                </p>
              </div>
            ) : (
              <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
                No AI insight generated yet. Use the button above to create your first one.
              </p>
            )}
          </div>

          <div className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <h2 className="text-xl font-semibold">Shared patients with AI permission</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              These are patient workspaces where your current shared-access permissions allow AI generation.
            </p>

            <div className="mt-5 space-y-4">
              {sharedPatients.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No shared patients currently allow AI generation.
                </p>
              ) : (
                sharedPatients.map((grant) => (
                  <div key={grant.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                    <p className="font-medium">
                      {grant.owner.healthProfile?.fullName ?? grant.owner.name ?? "Patient"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {grant.owner.email}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={`/patient/${grant.owner.id}`}
                        className="inline-flex rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                      >
                        Open shared patient workspace
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
          <h2 className="text-xl font-semibold">Insight history</h2>
          <div className="mt-5 space-y-4">
            {insights.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No AI insight history yet.</p>
            ) : (
              insights.map((item) => (
                <div key={item.id} className="rounded-3xl border border-zinc-200/80 p-4 dark:border-zinc-800">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {item.summary}
                  </p>
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                    {item.createdAt.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}