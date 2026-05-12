import Link from "next/link";
import { StatusPill } from "@/components/common";
import { buildAlertWorkflowCard } from "@/lib/alerts/workflow";

type AlertItem = {
  id: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  category: string;
  createdAt: Date;
  visibleToCareTeam: boolean;
  ownerAcknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
  dismissedAt?: Date | null;
  rule?: { name?: string | null } | null;
  sourceSummary?: string | null;
};

export function AlertList({ alerts }: { alerts: AlertItem[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
        No alert events found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => {
        const workflow = buildAlertWorkflowCard(alert);

        return (
          <Link
            key={alert.id}
            href={`/alerts/${alert.id}`}
            className="block rounded-3xl border border-border/60 bg-background/40 p-5 transition hover:bg-muted/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <StatusPill tone={workflow.triage.tone}>{workflow.triage.label}</StatusPill>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusPill tone="neutral">{workflow.statusLabel}</StatusPill>
                <StatusPill tone={workflow.triage.tone}>{workflow.severityLabel}</StatusPill>
                <StatusPill tone={workflow.visibility.tone}>{workflow.visibility.label}</StatusPill>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-xs text-muted-foreground md:grid-cols-[1fr_1.2fr]">
              <div>
                Rule: {alert.rule?.name ?? "System generated"} • {workflow.categoryLabel} • {workflow.ageLabel}
                {alert.sourceSummary ? ` • ${alert.sourceSummary}` : ""}
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/50 px-3 py-2">
                <span className="font-medium text-foreground/80">Next step:</span> {workflow.triage.nextAction}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
