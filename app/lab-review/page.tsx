import Link from "next/link";
import { Beaker, ClipboardList, FileText, FlaskConical, Search, TrendingUp } from "lucide-react";
import { LabFlag } from "@prisma/client";
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
import { getLabFlagTone, getLabPriorityTone, getLabReviewData, type LabTrendCard } from "@/lib/lab-review";

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(value);
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
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function StatCard({ title, value, description, icon }: { title: string; value: string | number; description: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/70 p-2">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function TrendCard({ item }: { item: LabTrendCard }) {
  const directionTone =
    item.direction === "improved" ? "success" : item.direction === "worse" ? "danger" : item.direction === "watch" ? "warning" : "info";

  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{item.testName}</p>
          <p className="mt-1 text-sm text-muted-foreground">Latest: {item.latestValue}</p>
          {item.previousValue ? <p className="mt-1 text-xs text-muted-foreground">Previous: {item.previousValue}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill tone={getLabFlagTone(item.latestFlag)}>{item.latestFlag}</StatusPill>
          <StatusPill tone={directionTone}>{item.direction}</StatusPill>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge>{item.count} result{item.count === 1 ? "" : "s"}</Badge>
        <Badge>{formatDate(item.latestDate)}</Badge>
      </div>
    </div>
  );
}

export default async function LabReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const q = typeof params.q === "string" ? params.q : "";
  const flagParam = typeof params.flag === "string" ? params.flag : "ALL";
  const flag = flagParam === "NORMAL" || flagParam === "BORDERLINE" || flagParam === "HIGH" || flagParam === "LOW" ? flagParam : "ALL";

  const data = await getLabReviewData(user.id!, { q, flag });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Lab Review Hub"
          description="Review abnormal results, trend movement, follow-up reminders, and document linkage before your next appointment."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/labs" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">
                Open labs
              </Link>
              <Link href="/summary/print?mode=doctor" className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:opacity-95">
                Doctor packet
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Readiness score" value={`${data.summary.readinessScore}%`} description="Blends lab freshness, flag pressure, and document coverage." icon={<ClipboardList className="h-5 w-5 text-primary" />} />
          <StatCard title="Flagged results" value={data.summary.abnormalLabs + data.summary.borderlineLabs} description={`${data.summary.flaggedRate}% of lab history needs watch or review.`} icon={<Beaker className="h-5 w-5 text-amber-500" />} />
          <StatCard title="Document coverage" value={`${data.summary.documentCoverage}%`} description="Lab records with linked report files for handoff context." icon={<FileText className="h-5 w-5 text-sky-500" />} />
          <StatCard title="Follow-ups" value={data.summary.labReminders} description="Due, overdue, or missed lab follow-up reminders." icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Lab readiness</CardTitle>
              <CardDescription>Quick signal for whether lab data is ready for review or provider handoff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold">{data.summary.readinessScore}%</p>
                  <p className="text-sm text-muted-foreground">{data.summary.totalLabs} total result{data.summary.totalLabs === 1 ? "" : "s"}</p>
                </div>
                <StatusPill tone={readinessTone(data.summary.readinessScore)}>
                  {data.summary.readinessScore >= 80 ? "Ready" : data.summary.readinessScore >= 55 ? "Review" : "Needs cleanup"}
                </StatusPill>
              </div>
              <ProgressBar value={data.summary.readinessScore} />
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Normal</p>
                  <p className="text-muted-foreground">{data.flagBreakdown.normal} results</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Borderline</p>
                  <p className="text-muted-foreground">{data.flagBreakdown.borderline} results</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">High</p>
                  <p className="text-muted-foreground">{data.flagBreakdown.high} results</p>
                </div>
                <div className="rounded-2xl border border-border/60 p-3">
                  <p className="font-medium">Low</p>
                  <p className="text-muted-foreground">{data.flagBreakdown.low} results</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended lab actions</CardTitle>
              <CardDescription>Highest-value cleanup and follow-up items from your lab history.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.actions.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={getLabPriorityTone(item.priority)}>{item.priority}</StatusPill>
                        <p className="font-medium">{item.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <Link href={item.href} className="text-sm font-medium text-primary hover:underline">
                      Review
                    </Link>
                  </div>
                </div>
              ))}
              {data.actions.length === 0 ? <EmptyState title="No urgent lab actions" description="Your lab records do not currently show abnormal results, missed follow-ups, or document cleanup work." /> : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lab trend cards</CardTitle>
            <CardDescription>Latest result per test with previous-result context when available.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.trendCards.map((item) => <TrendCard key={item.testName} item={item} />)}
            {data.trendCards.length === 0 ? <EmptyState title="No lab trends yet" description="Add lab results to see trend cards and provider-ready review notes." /> : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Lab result register</CardTitle>
              <CardDescription>Search and filter lab results without leaving the review hub.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input name="q" defaultValue={data.filters.q} placeholder="Search test, result, range, or file" className="pl-9" />
                </div>
                <Select name="flag" defaultValue={data.filters.flag}>
                  <option value="ALL">All flags</option>
                  {Object.values(LabFlag).map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Button type="submit">Filter</Button>
              </form>

              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Test</TH>
                      <TH>Result</TH>
                      <TH>Flag</TH>
                      <TH>Reference</TH>
                      <TH>Date</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.labs.map((lab) => (
                      <TR key={lab.id}>
                        <TD className="font-medium">{lab.testName}</TD>
                        <TD>{lab.resultSummary}</TD>
                        <TD><StatusPill tone={getLabFlagTone(lab.flag)}>{lab.flag}</StatusPill></TD>
                        <TD className="text-muted-foreground">{lab.referenceRange || "—"}</TD>
                        <TD className="text-muted-foreground">{formatDate(lab.dateTaken)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
              {data.labs.length === 0 ? <EmptyState title="No matching labs" description="Try another search term or filter to review your lab history." /> : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lab document coverage</CardTitle>
                <CardDescription>Recent lab files and whether they are ready to support records and visits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.labDocuments.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{document.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{document.fileName} • {formatDate(document.createdAt)}</p>
                      </div>
                      <StatusPill tone={document.linkedRecordId ? "success" : "warning"}>{document.linkedRecordId ? "Linked" : "Unlinked"}</StatusPill>
                    </div>
                  </div>
                ))}
                {data.labDocuments.length === 0 ? <EmptyState title="No lab documents" description="Upload lab files or link existing documents to lab results." /> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lab follow-up reminders</CardTitle>
                <CardDescription>Due, overdue, and missed lab follow-up tasks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.labReminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{reminder.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(reminder.dueAt)}</p>
                      </div>
                      <StatusPill tone={reminder.state === "OVERDUE" || reminder.state === "MISSED" ? "danger" : "warning"}>{reminder.state}</StatusPill>
                    </div>
                    {reminder.description ? <p className="mt-2 text-sm text-muted-foreground">{reminder.description}</p> : null}
                  </div>
                ))}
                {data.labReminders.length === 0 ? <EmptyState title="No lab reminders" description="Lab follow-up reminders will appear here when they are due or overdue." /> : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Provider review note</CardTitle>
            <CardDescription>Use this hub before visits to identify which lab results need explanation, follow-up, or file cleanup.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <FlaskConical className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Review flagged results first</p>
              <p className="mt-1 text-sm text-muted-foreground">High, low, and borderline labs are sorted into the action queue.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <FileText className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Attach source files</p>
              <p className="mt-1 text-sm text-muted-foreground">Linked lab documents make the doctor packet more complete.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <ClipboardList className="h-5 w-5 text-primary" />
              <p className="mt-3 font-medium">Close the loop</p>
              <p className="mt-1 text-sm text-muted-foreground">Follow-up reminders help track repeat tests and pending provider review.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
