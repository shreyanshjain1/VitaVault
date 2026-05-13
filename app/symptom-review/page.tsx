import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { SymptomSeverity } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { requireUser } from "@/lib/session";
import {
  getSymptomPriorityTone,
  getSymptomReviewData,
  getSymptomSeverityTone,
  type SymptomCluster,
  type SymptomPatternCard,
  type SymptomTimelineItem,
} from "@/lib/symptom-review";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
    value,
  );
}

function readinessTone(value: number): "success" | "warning" | "danger" {
  if (value >= 80) return "success";
  if (value >= 55) return "warning";
  return "danger";
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-2">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function ClusterCard({ item }: { item: SymptomCluster }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest: {formatDate(item.latestAt)}
          </p>
        </div>
        <StatusPill tone={item.tone}>
          {item.severe > 0
            ? "Severe"
            : item.unresolved > 0
              ? "Open"
              : "Resolved"}
        </StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge>{item.count} total</Badge>
        <Badge>{item.unresolved} unresolved</Badge>
        <Badge>{item.severe} severe</Badge>
      </div>
    </div>
  );
}

function PatternCard({ item }: { item: SymptomPatternCard }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.label}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest: {formatDate(item.latestAt)}
          </p>
        </div>
        <StatusPill tone={item.tone}>{item.stateLabel}</StatusPill>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{item.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge>{item.count} entries</Badge>
        <Badge>{item.unresolved} open</Badge>
        <Badge>{item.severe} severe</Badge>
        <Badge>{item.cadenceLabel}</Badge>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <p>Severity trail: {item.severityTrail}</p>
        <p>
          Trigger signal:{" "}
          {item.dominantTrigger ?? "No repeated trigger captured"}
        </p>
      </div>
      <div className="mt-3 rounded-2xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Recommended follow-up</p>
        <p className="mt-1">{item.nextStep}</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {item.reviewChecklist.map((checklistItem) => (
            <li key={checklistItem}>{checklistItem}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TimelineRow({ item }: { item: SymptomTimelineItem }) {
  return (
    <TR>
      <TD>
        <div className="space-y-1">
          <p className="font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.detail}</p>
        </div>
      </TD>
      <TD>
        <StatusPill tone={getSymptomSeverityTone(item.severity)}>
          {item.severity}
        </StatusPill>
      </TD>
      <TD>
        <StatusPill tone={item.resolved ? "success" : "warning"}>
          {item.resolved ? "Resolved" : "Open"}
        </StatusPill>
      </TD>
      <TD className="text-sm text-muted-foreground">{formatDate(item.at)}</TD>
      <TD>
        <Link
          href={`/symptoms?focus=${item.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Open
        </Link>
      </TD>
    </TR>
  );
}

export default async function SymptomReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q : "";
  const severityParam =
    typeof params.severity === "string" ? params.severity : "ALL";
  const statusParam = typeof params.status === "string" ? params.status : "ALL";
  const severity =
    severityParam === "MILD" ||
    severityParam === "MODERATE" ||
    severityParam === "SEVERE"
      ? severityParam
      : "ALL";
  const status =
    statusParam === "OPEN" || statusParam === "RESOLVED" ? statusParam : "ALL";

  const data = await getSymptomReviewData(user.id!, { q, severity, status });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Symptom Review Hub"
          description="Review unresolved symptoms, severity patterns, body-area clusters, alerts, and follow-up reminders before care handoffs."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/symptoms"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60"
              >
                Open symptoms
              </Link>
              <Link
                href="/visit-prep"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-95"
              >
                Visit prep
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Readiness score"
            value={`${data.summary.readinessScore}%`}
            description="Blends unresolved severity, documentation coverage, alerts, and follow-up state."
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Unresolved"
            value={data.summary.unresolvedSymptoms}
            description="Open symptom entries that may need resolution notes or follow-up."
            icon={<Activity className="h-5 w-5 text-amber-500" />}
          />
          <StatCard
            title="Severe open"
            value={data.summary.severeUnresolved}
            description="Severe unresolved symptoms should be reviewed first."
            icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
          />
          <StatCard
            title="Pattern queue"
            value={data.patternSummary.reviewQueue}
            description={`${data.patternSummary.actionRequired} need direct action before visit prep or export.`}
            icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          />
          <StatCard
            title="Notes coverage"
            value={`${data.summary.documentationCoverage}%`}
            description="Recent symptom entries with provider-useful context notes."
            icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Symptom readiness</CardTitle>
              <CardDescription>
                Quick signal for whether symptom history is ready for care
                review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">
                    {data.summary.readinessScore}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.summary.recentSymptoms} symptom
                    {data.summary.recentSymptoms === 1 ? "" : "s"} in the last
                    30 days
                  </p>
                </div>
                <StatusPill tone={readinessTone(data.summary.readinessScore)}>
                  {data.summary.readinessScore >= 80
                    ? "Ready"
                    : data.summary.readinessScore >= 55
                      ? "Review"
                      : "Needs follow-up"}
                </StatusPill>
              </div>
              <ProgressBar value={data.summary.readinessScore} />
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Mild</p>
                  <p className="text-muted-foreground">
                    {data.severityBreakdown.mild} recent
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Moderate</p>
                  <p className="text-muted-foreground">
                    {data.severityBreakdown.moderate} recent
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Severe</p>
                  <p className="text-muted-foreground">
                    {data.severityBreakdown.severe} recent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended symptom actions</CardTitle>
              <CardDescription>
                Highest-value clinical follow-up and documentation tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.actions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/60 bg-background/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          tone={getSymptomPriorityTone(item.priority)}
                        >
                          {item.priority}
                        </StatusPill>
                        <p className="font-medium">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
              {data.actions.length === 0 ? (
                <EmptyState
                  title="No urgent symptom actions"
                  description="Your recent symptom history does not show severe unresolved entries, open symptom alerts, or due follow-ups."
                />
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Symptom pattern signals</CardTitle>
            <CardDescription>
              Recurring, worsening, stale, and resolved symptom patterns
              prepared for provider review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm md:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="font-medium">Worsening</p>
                <p className="text-muted-foreground">
                  {data.patternSummary.worsening} pattern
                  {data.patternSummary.worsening === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="font-medium">Recurring</p>
                <p className="text-muted-foreground">
                  {data.patternSummary.recurring} pattern
                  {data.patternSummary.recurring === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="font-medium">High severity</p>
                <p className="text-muted-foreground">
                  {data.patternSummary.highSeverity} pattern
                  {data.patternSummary.highSeverity === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="font-medium">Action needed</p>
                <p className="text-muted-foreground">
                  {data.patternSummary.actionRequired} pattern
                  {data.patternSummary.actionRequired === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="font-medium">Stale open</p>
                <p className="text-muted-foreground">
                  {data.patternSummary.staleOpen} pattern
                  {data.patternSummary.staleOpen === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 p-3">
                <p className="font-medium">Resolved</p>
                <p className="text-muted-foreground">
                  {data.patternSummary.resolved} pattern
                  {data.patternSummary.resolved === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {data.patternCards.map((item) => (
                <PatternCard key={item.id} item={item} />
              ))}
              {data.patternCards.length === 0 ? (
                <EmptyState
                  title="No symptom patterns yet"
                  description="Add symptom entries with body areas or repeated titles to build pattern signals."
                />
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Body-area clusters</CardTitle>
            <CardDescription>
              Grouped symptom pressure by affected area for faster provider
              review.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.clusters.map((item) => (
              <ClusterCard key={item.key} item={item} />
            ))}
            {data.clusters.length === 0 ? (
              <EmptyState
                title="No symptom clusters yet"
                description="Add symptom entries with body areas to see grouped review cards."
              />
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Symptom register</CardTitle>
              <CardDescription>
                Search and filter symptom entries without leaving the review
                hub.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="q"
                    defaultValue={data.filters.q}
                    placeholder="Search symptom, body area, trigger, or notes"
                    className="pl-9"
                  />
                </div>
                <Select name="severity" defaultValue={data.filters.severity}>
                  <option value="ALL">All severity</option>
                  {Object.values(SymptomSeverity).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
                <Select name="status" defaultValue={data.filters.status}>
                  <option value="ALL">All status</option>
                  <option value="OPEN">Open</option>
                  <option value="RESOLVED">Resolved</option>
                </Select>
                <Button type="submit">Filter</Button>
              </form>

              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Symptom</TH>
                      <TH>Severity</TH>
                      <TH>Status</TH>
                      <TH>Started</TH>
                      <TH>Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.timeline.map((item) => (
                      <TimelineRow key={item.id} item={item} />
                    ))}
                  </TBody>
                </Table>
              </div>
              {data.timeline.length === 0 ? (
                <EmptyState
                  title="No matching symptoms"
                  description="Try changing the search, severity, or status filters."
                />
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Care handoff signals</CardTitle>
                <CardDescription>
                  Symptom context that should be surfaced during visits or
                  shared-care review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-border/60 p-4">
                  <div>
                    <p className="font-medium">Open symptom alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Alert Center items related to symptom severity.
                    </p>
                  </div>
                  <StatusPill
                    tone={data.summary.openAlerts > 0 ? "warning" : "success"}
                  >
                    {data.summary.openAlerts}
                  </StatusPill>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 p-4">
                  <div>
                    <p className="font-medium">Follow-up reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Due, overdue, or missed symptom follow-ups.
                    </p>
                  </div>
                  <StatusPill
                    tone={
                      data.summary.followUpReminders > 0 ? "warning" : "success"
                    }
                  >
                    {data.summary.followUpReminders}
                  </StatusPill>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 p-4">
                  <div>
                    <p className="font-medium">Resolution rate</p>
                    <p className="text-sm text-muted-foreground">
                      Recent symptoms marked resolved.
                    </p>
                  </div>
                  <StatusPill
                    tone={
                      data.summary.resolutionRate >= 70
                        ? "success"
                        : data.summary.resolutionRate >= 40
                          ? "warning"
                          : "danger"
                    }
                  >
                    {data.summary.resolutionRate}%
                  </StatusPill>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provider review note</CardTitle>
                <CardDescription>
                  What to focus on before a doctor visit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  Start with severe unresolved symptoms, then moderate
                  unresolved items, then repeated body-area clusters.
                </p>
                <p className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  Add notes for triggers, timing, duration, self-care steps, and
                  whether the symptom affected work, sleep, or mobility.
                </p>
                <Link
                  href="/summary/print?mode=doctor"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Stethoscope className="h-4 w-4" /> Generate doctor packet
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
