import Link from "next/link";
import { CalendarDays, Download, Filter, Search, ShieldAlert, Workflow } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getTimelineWorkspaceData, type TimelineItem, type TimelineTone } from "@/lib/timeline";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function typeLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function timelineToneLabel(tone: TimelineTone) {
  if (tone === "danger") return "Urgent";
  if (tone === "warning") return "Watch";
  if (tone === "success") return "Resolved";
  if (tone === "info") return "Info";
  return "Routine";
}

function StatCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="mt-2 text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function TimelineItemCard({ item }: { item: TimelineItem }) {
  return (
    <Link href={item.href} className="block rounded-3xl border border-border/60 bg-background/40 p-5 transition hover:border-border hover:bg-muted/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={item.tone}>{typeLabel(item.type)}</StatusPill>
            <StatusPill tone={item.riskLevel === "urgent" ? "danger" : item.riskLevel === "watch" ? "warning" : "neutral"}>{item.riskLevel}</StatusPill>
          </div>
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="max-w-3xl text-sm text-muted-foreground">{item.description}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{formatDateTime(item.occurredAt)}</p>
          <p className="mt-1">{item.source}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function TimelinePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const filters = {
    type: typeof params.type === "string" ? params.type : "all",
    tone: typeof params.tone === "string" ? params.tone : "all",
    q: typeof params.q === "string" ? params.q : "",
    from: typeof params.from === "string" ? params.from : "",
    to: typeof params.to === "string" ? params.to : "",
  };
  const data = await getTimelineWorkspaceData(user.id!, filters);

  const printParams = new URLSearchParams();
  for (const [key, value] of Object.entries(data.appliedFilters)) {
    if (value && value !== "all") printParams.set(key, value);
  }
  const printHref = `/timeline/print${printParams.toString() ? `?${printParams.toString()}` : ""}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Patient timeline"
          description="A filterable longitudinal view of records, care events, risks, reminders, documents, and handoff context."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={printHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">
                <Download className="h-4 w-4" /> Print timeline
              </Link>
              <Link href="/summary" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition-all hover:border-border hover:bg-muted/60">Patient summary</Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Visible events" value={data.summary.visibleItems} description={`${data.summary.totalItems} total timeline records loaded.`} />
          <StatCard title="Urgent" value={data.summary.urgentItems} description="Severe symptoms or critical alert events in the current view." />
          <StatCard title="Watch" value={data.summary.watchItems} description="Warning-state labs, reminders, appointments, or moderate symptoms." />
          <StatCard title="Documents" value={data.summary.documentItems} description="Medical files represented in the current timeline view." />
          <StatCard title="Record types" value={data.summary.recordTypesCovered} description="Distinct clinical and workflow sources present in history." />
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Timeline filters</CardTitle>
                <CardDescription>Filter by source, status tone, date range, or keyword before printing a handoff timeline.</CardDescription>
              </div>
              <Badge>{formatDateTime(data.summary.oldestItemAt)} → {formatDateTime(data.summary.newestItemAt)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]" action="/timeline">
              <div className="space-y-2">
                <Label htmlFor="q">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="q" name="q" defaultValue={data.appliedFilters.q} placeholder="Search title, notes, source..." className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Record type</Label>
                <Select id="type" name="type" defaultValue={data.appliedFilters.type}>
                  <option value="all">All types</option>
                  {data.availableTypes.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select id="tone" name="tone" defaultValue={data.appliedFilters.tone}>
                  <option value="all">All tones</option>
                  {data.availableTones.map((tone) => <option key={tone} value={tone}>{timelineToneLabel(tone)}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Input id="from" name="from" type="date" defaultValue={data.appliedFilters.from} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input id="to" name="to" type="date" defaultValue={data.appliedFilters.to} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">Apply</Button>
                <Link href="/timeline" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium transition hover:bg-muted/60">Reset</Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Timeline risk markers</CardTitle>
                <CardDescription>Use these as quick handoff signals before a visit or export.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Urgent records</span><StatusPill tone={data.summary.urgentItems ? "danger" : "success"}>{data.summary.urgentItems}</StatusPill></div>
                  <p className="mt-2 text-sm text-muted-foreground">Critical alert or severe unresolved symptom events in the current view.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Watch records</span><StatusPill tone={data.summary.watchItems ? "warning" : "success"}>{data.summary.watchItems}</StatusPill></div>
                  <p className="mt-2 text-sm text-muted-foreground">Warning-state items that should be reviewed before sharing the timeline.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Coverage</span><StatusPill tone={data.summary.recordTypesCovered >= 5 ? "success" : "warning"}>{data.summary.recordTypesCovered} types</StatusPill></div>
                  <p className="mt-2 text-sm text-muted-foreground">A stronger handoff includes labs, vitals, symptoms, medications, reminders, and documents.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Month index</CardTitle>
                <CardDescription>Grouped by month for faster review.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.groups.map((group) => (
                  <a key={group.key} href={`#month-${group.key}`} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm transition hover:bg-muted/50">
                    <span>{group.label}</span>
                    <span className="text-muted-foreground">{group.items.length} events{group.riskCount ? ` • ${group.riskCount} risk` : ""}</span>
                  </a>
                ))}
                {data.groups.length === 0 ? <EmptyState title="No months to show" description="Adjust filters to restore timeline results." /> : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Longitudinal history</CardTitle>
              <CardDescription>Events are grouped by month and ordered from newest to oldest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {data.groups.map((group) => (
                <section key={group.key} id={`month-${group.key}`} className="space-y-3 scroll-mt-24">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-muted-foreground" />
                      <h2 className="font-semibold">{group.label}</h2>
                    </div>
                    <div className="flex gap-2">
                      <Badge>{group.items.length} events</Badge>
                      {group.riskCount ? <StatusPill tone="warning">{group.riskCount} review</StatusPill> : null}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => <TimelineItemCard key={`${item.type}-${item.id}`} item={item} />)}
                  </div>
                </section>
              ))}
              {data.visibleItems.length === 0 ? <EmptyState title="No timeline items found" description="Try clearing filters or adding health records first." /> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
