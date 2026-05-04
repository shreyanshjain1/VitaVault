import Link from "next/link";
import { AlertTriangle, BrainCircuit, ClipboardList, Database, FileText, HelpCircle, History, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getAiInsightsWorkspaceData, type AiEvidenceCard, type AiRiskSignal } from "@/lib/ai-insights-workspace";
import { requireUser } from "@/lib/session";
import { generateOwnAiInsightAction } from "./actions";

type SearchParams = Promise<{ error?: string; success?: string }>;

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function riskTone(value: string) {
  if (["high", "urgent", "critical"].includes(value.toLowerCase())) return "danger" as const;
  if (["medium", "warning"].includes(value.toLowerCase())) return "warning" as const;
  if (["low", "info"].includes(value.toLowerCase())) return "info" as const;
  return "neutral" as const;
}

function sourceTone(status: AiEvidenceCard["status"]) {
  if (status === "Ready") return "success" as const;
  if (status === "Sparse") return "warning" as const;
  return "neutral" as const;
}

function riskSignalTone(severity: AiRiskSignal["severity"]) {
  if (severity === "urgent") return "danger" as const;
  if (severity === "warning") return "warning" as const;
  return "info" as const;
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function EvidenceCard({ item }: { item: AiEvidenceCard }) {
  return (
    <Link href={item.href} className="rounded-3xl border border-border/60 bg-background/60 p-4 transition hover:border-primary/40 hover:bg-muted/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
        </div>
        <StatusPill tone={sourceTone(item.status)}>{item.status}</StatusPill>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge>{item.count} records</Badge>
        <Badge>Latest: {formatDateTime(item.latestAt)}</Badge>
      </div>
    </Link>
  );
}

function StatusMessage({ error, success }: { error?: string; success?: string }) {
  if (success === "1") {
    return <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">AI insight generated successfully.</div>;
  }

  if (error === "quota") {
    return <div className="rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">OpenAI API quota or billing is not available. VitaVault can still save fallback insight summaries for demo continuity.</div>;
  }

  if (error === "not_configured") {
    return <div className="rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">AI is not configured. Set <span className="font-mono">OPENAI_API_KEY</span> and optional <span className="font-mono">OPENAI_MODEL</span>, then retry.</div>;
  }

  if (error === "general") {
    return <div className="rounded-3xl border border-rose-200/70 bg-rose-50/70 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">AI insight generation failed. Please try again.</div>;
  }

  return null;
}

export default async function AiInsightsPage({ searchParams }: { searchParams?: SearchParams }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const data = await getAiInsightsWorkspaceData(user.id);
  const isAiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const latest = data.latestInsight;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="AI Insights"
          description="Turn structured health records into source-aware summaries, care questions, risk signals, and visit-prep follow-ups. Informational only, not diagnostic."
          action={
            <div className="flex flex-wrap gap-3">
              <form action={generateOwnAiInsightAction}>
                <Button type="submit" disabled={!isAiConfigured}>
                  <Sparkles className="h-4 w-4" />
                  Generate new insight
                </Button>
              </form>
              <Link href="/care-plan" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50">Open Care Plan</Link>
              <Link href="/visit-prep" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50">Visit Prep</Link>
            </div>
          }
        />

        <StatusMessage error={params.error} success={params.success} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>AI readiness</CardDescription>
              <CardTitle className="mt-2 text-3xl">{data.readinessScore}%</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgressBar value={data.readinessScore} />
              <p className="text-sm text-muted-foreground">Based on profile, records, workflows, and previous insight coverage.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Records available</CardDescription>
              <CardTitle className="mt-2 text-3xl">{data.sourceSummary.totalRecords}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Structured records available for source-aware summarization.</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Open signals</CardDescription>
              <CardTitle className="mt-2 text-3xl">{data.sourceSummary.openAlerts + data.sourceSummary.dueReminders}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Open alerts and due reminders that can shape follow-up planning.</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>AI status</CardDescription>
              <CardTitle className="mt-2 text-xl">{isAiConfigured ? "Configured" : "Fallback-ready"}</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusPill tone={isAiConfigured ? "success" : "warning"}>{isAiConfigured ? "Live AI" : "Demo fallback"}</StatusPill>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> Latest source-linked insight</CardTitle>
                  <CardDescription>Generated for {data.patientLabel}. Includes summary, flags, questions, and follow-up actions.</CardDescription>
                </div>
                {latest ? <StatusPill tone={riskTone(latest.adherenceRisk)}>{latest.adherenceRisk.toUpperCase()} risk</StatusPill> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {latest ? (
                <>
                  <div className="rounded-3xl border border-border/60 bg-background/60 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{formatDateTime(latest.createdAt)}</Badge>
                      <Badge>{latest.trendFlags.length} trend flags</Badge>
                    </div>
                    <p className="mt-4 text-lg font-semibold">{latest.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{latest.summary}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl border border-border/60 bg-background/60 p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4" /> Trend flags</p>
                      <div className="mt-3 space-y-3">
                        {latest.trendFlags.length ? latest.trendFlags.map((flag, index) => (
                          <div key={`${flag.type}-${index}`} className="rounded-2xl border border-border/60 bg-background/60 p-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2"><StatusPill tone={riskTone(flag.severity)}>{flag.severity}</StatusPill><Badge>{flag.type}</Badge></div>
                            <p className="mt-2 text-muted-foreground">{flag.message}</p>
                          </div>
                        )) : <p className="text-sm text-muted-foreground">No trend flags were saved with this insight.</p>}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-border/60 bg-background/60 p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold"><HelpCircle className="h-4 w-4" /> Suggested clinician questions</p>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {data.suggestedQuestions.length ? data.suggestedQuestions.slice(0, 5).map((question, index) => <li key={index}>• {question}</li>) : <li>No suggested questions saved yet.</li>}
                      </ul>
                    </div>
                  </div>

                  <p className="rounded-3xl border border-border/60 bg-background/60 p-4 text-xs text-muted-foreground">{latest.disclaimer}</p>
                </>
              ) : (
                <EmptyState title="No AI insight yet" description="Generate the first insight once profile, records, and care signals are ready." />
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Recommended next actions</CardTitle>
                <CardDescription>Follow-ups from the latest insight plus due workflow items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.followUpItems.length ? data.followUpItems.map((item) => (
                  <Link key={item.id} href={item.href} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:border-primary/40 hover:bg-muted/40">
                    <div className="flex flex-wrap items-center gap-2"><Badge>{item.source}</Badge><span className="font-medium">{item.title}</span></div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                  </Link>
                )) : <EmptyState title="No follow-up queue" description="AI follow-ups and due reminders will appear here." />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Prompt transparency</CardTitle>
                <CardDescription>What the assistant can and cannot use.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-2">
                  {data.sourceSummary.promptModules.length ? data.sourceSummary.promptModules.map((module) => <Badge key={module}>{module}</Badge>) : <Badge>No record modules yet</Badge>}
                </div>
                {data.transparencyNotes.map((note) => <p key={note} className="rounded-2xl border border-border/60 bg-background/60 p-3">{note}</p>)}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Source coverage</CardTitle>
              <CardDescription>Records that can support AI summaries and care-plan recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {data.evidenceCards.map((item) => <EvidenceCard key={item.label} item={item} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Risk signal board</CardTitle>
              <CardDescription>Open signals the AI summary should keep visible for review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.riskSignals.length ? data.riskSignals.map((signal) => (
                <Link key={signal.id} href={signal.href} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:border-primary/40 hover:bg-muted/40">
                  <div className="flex flex-wrap items-center gap-2"><StatusPill tone={riskSignalTone(signal.severity)}>{signal.severity}</StatusPill><span className="font-medium">{signal.title}</span></div>
                  <p className="mt-2 text-sm text-muted-foreground">{signal.detail}</p>
                </Link>
              )) : <EmptyState title="No major risk signals" description="Open alerts, abnormal labs, severe symptoms, missed logs, and vital review signals will appear here." />}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Insight history</CardTitle>
              <CardDescription>Your last 12 generated insights.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.insights.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.insights.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-border/60 bg-background/60 p-5">
                      <div className="flex flex-wrap items-center gap-2"><StatusPill tone={riskTone(item.adherenceRisk)}>{item.adherenceRisk}</StatusPill><Badge>{formatDateTime(item.createdAt)}</Badge></div>
                      <p className="mt-3 font-semibold">{item.title}</p>
                      <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{item.summary}</p>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="No insight history" description="Generated insight cards will appear here." />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Shared patients with AI permission</CardTitle>
              <CardDescription>Care-team workspaces where AI generation is allowed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.sharedPatients.length ? data.sharedPatients.map((patient) => (
                <Link key={patient.id} href={patient.href} className="block rounded-2xl border border-border/60 bg-background/60 p-4 transition hover:border-primary/40 hover:bg-muted/40">
                  <div className="flex flex-wrap items-center gap-2"><StatusPill tone="info">{patient.accessRole}</StatusPill><span className="font-medium">{patient.patientName}</span></div>
                  <p className="mt-2 text-sm text-muted-foreground">{patient.email}</p>
                </Link>
              )) : <EmptyState title="No shared AI workspaces" description="Shared patients with AI permissions will appear here." />}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
