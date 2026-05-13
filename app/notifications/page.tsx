import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  ClipboardList,
  FileText,
  Inbox,
  RadioTower,
  Users,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RotateCcw,
  Sparkles,
} from "lucide-react";
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
} from "@/components/ui";
import { requireUser } from "@/lib/session";
import {
  getNotificationCenterData,
  getNotificationItemSignal,
  type NotificationItem,
  type NotificationPriority,
  type NotificationReliabilityState,
  type NotificationSource,
  type NotificationTone,
} from "@/lib/notification-center";
import {
  acknowledgeNotificationAlertAction,
  completeNotificationReminderAction,
  createNotificationFollowUpReminderAction,
  resolveNotificationAlertAction,
  skipNotificationReminderAction,
  snoozeNotificationReminderAction,
} from "./actions";

const sourceLabels: Record<NotificationSource, string> = {
  ALERT: "Alerts",
  REMINDER: "Reminders",
  APPOINTMENT: "Appointments",
  LAB: "Labs",
  DOCUMENT: "Documents",
  CARE: "Care team",
  DEVICE: "Devices",
};

const sourceIcons: Record<NotificationSource, typeof BellRing> = {
  ALERT: AlertTriangle,
  REMINDER: BellRing,
  APPOINTMENT: CalendarClock,
  LAB: ClipboardList,
  DOCUMENT: FileText,
  CARE: Users,
  DEVICE: RadioTower,
};

const stateLabels: Record<NotificationReliabilityState, string> = {
  urgent: "Urgent",
  due_now: "Due now",
  follow_up: "Follow-up",
  stale: "Stale",
  scheduled: "Scheduled",
  review: "Needs review",
};

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function priorityTone(priority: NotificationPriority): NotificationTone {
  if (priority === "critical" || priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "neutral";
}

function sourceTone(source: NotificationSource): NotificationTone {
  if (source === "ALERT") return "danger";
  if (source === "REMINDER") return "warning";
  if (source === "LAB" || source === "DEVICE") return "info";
  if (source === "CARE") return "success";
  return "neutral";
}

function filterHref(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "ALL") query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `/notifications?${qs}` : "/notifications";
}

function FollowUpForm({ item }: { item: NotificationItem }) {
  return (
    <form action={createNotificationFollowUpReminderAction}>
      <input type="hidden" name="source" value={item.source} />
      <input type="hidden" name="sourceId" value={item.sourceId} />
      <input type="hidden" name="title" value={item.title} />
      <input type="hidden" name="description" value={item.description} />
      <Button type="submit" size="sm" variant="outline">
        <Clock3 className="h-4 w-4" /> Follow up
      </Button>
    </form>
  );
}

function NotificationActions({ item }: { item: NotificationItem }) {
  if (item.source === "ALERT") {
    return (
      <div className="flex flex-wrap gap-2">
        {item.status === "OPEN" ? (
          <form action={acknowledgeNotificationAlertAction}>
            <input type="hidden" name="alertId" value={item.sourceId} />
            <Button type="submit" size="sm" variant="secondary">
              <CheckCircle2 className="h-4 w-4" /> Acknowledge
            </Button>
          </form>
        ) : null}
        <form action={resolveNotificationAlertAction}>
          <input type="hidden" name="alertId" value={item.sourceId} />
          <Button type="submit" size="sm">
            <CheckCircle2 className="h-4 w-4" /> Resolve
          </Button>
        </form>
        <FollowUpForm item={item} />
      </div>
    );
  }

  if (item.source === "REMINDER") {
    return (
      <div className="flex flex-wrap gap-2">
        <form action={completeNotificationReminderAction}>
          <input type="hidden" name="reminderId" value={item.sourceId} />
          <Button type="submit" size="sm">
            <CheckCircle2 className="h-4 w-4" /> Complete
          </Button>
        </form>
        <form action={snoozeNotificationReminderAction}>
          <input type="hidden" name="reminderId" value={item.sourceId} />
          <input type="hidden" name="minutes" value="60" />
          <Button type="submit" size="sm" variant="outline">
            <RotateCcw className="h-4 w-4" /> Snooze 1h
          </Button>
        </form>
        <form action={skipNotificationReminderAction}>
          <input type="hidden" name="reminderId" value={item.sourceId} />
          <Button type="submit" size="sm" variant="ghost">
            Skip
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <FollowUpForm item={item} />
    </div>
  );
}

function NotificationCard({ item }: { item: NotificationItem }) {
  const Icon = sourceIcons[item.source];
  const signal = getNotificationItemSignal(item);

  return (
    <div className="rounded-3xl border border-border/60 bg-background/50 p-5 transition hover:border-border hover:bg-muted/30">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/70">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={sourceTone(item.source)}>
                {sourceLabels[item.source]}
              </StatusPill>
              <StatusPill tone={priorityTone(item.priority)}>
                {item.priority}
              </StatusPill>
              <StatusPill tone={signal.tone}>{signal.label}</StatusPill>
              <Badge>{item.status}</Badge>
            </div>
            <div>
              <Link
                href={item.href}
                className="font-semibold tracking-tight hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <span className="font-semibold text-foreground">Action:</span>{" "}
                  {signal.actionLabel}
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <span className="font-semibold text-foreground">
                    Cleanup:
                  </span>{" "}
                  {signal.cleanupHint}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Original recommendation: {item.actionHint}
              </p>
            </div>
            <NotificationActions item={item} />
          </div>
        </div>
        <div className="shrink-0 text-left text-xs text-muted-foreground md:text-right">
          <p>{item.meta}</p>
          <p className="mt-1">{formatDateTime(item.dueAt || item.createdAt)}</p>
          <p className="mt-1 font-medium text-foreground">{signal.ageLabel}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
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

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const source = typeof params.source === "string" ? params.source : "ALL";
  const priority =
    typeof params.priority === "string" ? params.priority : "ALL";
  const state = typeof params.state === "string" ? params.state : "ALL";
  const data = await getNotificationCenterData(user.id!, {
    source,
    priority,
    state,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Notification Center"
          description="A unified action inbox for alerts, reminders, follow-ups, abnormal results, document hygiene, care invites, and device sync issues."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/alerts"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50"
              >
                Alerts
              </Link>
              <Link
                href="/reminders"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/50"
              >
                Reminders
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-95"
              >
                Dashboard
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Visible items"
            value={data.counts.visible}
            description={`${data.counts.total} total inbox signals before filters.`}
            icon={<Inbox className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            title="Critical"
            value={data.counts.critical}
            description="Critical alert or high-urgency workflow items."
            icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
          />
          <MetricCard
            title="High priority"
            value={data.counts.high}
            description="Items that should be reviewed before routine updates."
            icon={<BellRing className="h-5 w-5 text-amber-500" />}
          />
          <MetricCard
            title="Actionable"
            value={data.reliability.actionable}
            description="Items with a direct follow-through or cleanup path."
            icon={<ClipboardCheck className="h-5 w-5 text-emerald-500" />}
          />
          <MetricCard
            title="Cleanup queue"
            value={data.reliability.cleanupCandidates}
            description="Stale or follow-up items that should be cleared soon."
            icon={<Sparkles className="h-5 w-5 text-violet-500" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                  Switch between source and priority views without losing the
                  inbox context.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Source
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={filterHref({ source: "ALL", priority, state })}
                      className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                    >
                      All
                    </Link>
                    {data.counts.bySource.map((row) => (
                      <Link
                        key={row.source}
                        href={filterHref({
                          source: row.source,
                          priority,
                          state,
                        })}
                        className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                      >
                        {sourceLabels[row.source]} ({row.count})
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Priority
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["ALL", "critical", "high", "medium", "low"] as const
                    ).map((option) => (
                      <Link
                        key={option}
                        href={filterHref({ source, priority: option, state })}
                        className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                      >
                        {option}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Workflow state
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={filterHref({ source, priority, state: "ALL" })}
                      className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                    >
                      All
                    </Link>
                    {data.reliability.byState.map((row) => (
                      <Link
                        key={row.state}
                        href={filterHref({
                          source,
                          priority,
                          state: row.state,
                        })}
                        className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium hover:bg-muted/50"
                      >
                        {stateLabels[row.state]} ({row.count})
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended next actions</CardTitle>
                <CardDescription>
                  Generated from the current notification workload. Use item
                  actions to resolve, complete, snooze, or create follow-up
                  reminders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.nextActions.map((action) => (
                  <div
                    key={action}
                    className="rounded-2xl border border-border/60 bg-background/50 p-4 text-sm text-muted-foreground"
                  >
                    {action}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Unified inbox</CardTitle>
              <CardDescription>
                {source !== "ALL" || priority !== "ALL" || state !== "ALL"
                  ? `Filtered by source ${source}, priority ${priority}, and state ${state}.`
                  : "Sorted by priority first, then by the most relevant date."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.items.map((item) => (
                <NotificationCard key={item.id} item={item} />
              ))}
              {data.items.length === 0 ? (
                <EmptyState
                  title="Inbox is clear"
                  description="No alerts, reminders, follow-ups, document gaps, care invites, or device issues match the current filter."
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
