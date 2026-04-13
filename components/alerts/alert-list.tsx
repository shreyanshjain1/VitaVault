import Link from "next/link";
import { StatusPill } from "@/components/common";
import { alertCategoryLabel, alertSourceLabel } from "@/lib/alerts/constants";

function severityTone(severity: string): "neutral" | "info" | "success" | "warning" | "danger" {
  if (severity === "CRITICAL") return "danger";
  if (severity === "HIGH") return "warning";
  if (severity === "MEDIUM") return "info";
  return "neutral";
}

type AlertItem = {
  id: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  category: string;
  createdAt: Date;
  visibleToCareTeam: boolean;
  rule?: { name?: string | null } | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceHref?: string | null;
  sourceSummary?: string | null;
};

export function AlertList({
  alerts,
  ownerUserId,
}: {
  alerts: AlertItem[];
  ownerUserId: string;
}) {
  if (!alerts.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
        No alert events found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-3xl border border-border/60 bg-background/40 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/alerts/${alert.id}?ownerUserId=${ownerUserId}`}
                className="text-sm font-semibold hover:underline"
              >
                {alert.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill tone="neutral">{alert.status}</StatusPill>
              <StatusPill tone={severityTone(alert.severity)}>{alert.severity}</StatusPill>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="info">{alertCategoryLabel[alert.category] ?? alert.category}</StatusPill>
            {alert.sourceType ? (
              <StatusPill tone="neutral">{alertSourceLabel[alert.sourceType] ?? alert.sourceType}</StatusPill>
            ) : null}
            {alert.visibleToCareTeam ? <StatusPill tone="success">Care-team visible</StatusPill> : null}
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Rule: {alert.rule?.name ?? "System generated"} • {new Date(alert.createdAt).toLocaleString()}
          </div>

          {alert.sourceSummary ? (
            <div className="mt-3 rounded-2xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Source context:</span> {alert.sourceSummary}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/alerts/${alert.id}?ownerUserId=${ownerUserId}`}
              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium transition hover:bg-muted/50"
            >
              Open detail
            </Link>
            {alert.sourceHref ? (
              <Link
                href={alert.sourceHref}
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium transition hover:bg-muted/50"
              >
                Open source module
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
