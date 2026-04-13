import Link from "next/link";
import { StatusPill } from "@/components/common";

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
  sourceSummary?: string | null;
};

function severityTone(severity: string): "neutral" | "info" | "success" | "warning" | "danger" {
  if (severity === "CRITICAL") return "danger";
  if (severity === "HIGH") return "warning";
  if (severity === "MEDIUM") return "info";
  return "neutral";
}

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
      {alerts.map((alert) => (
        <Link
          key={alert.id}
          href={`/alerts/${alert.id}`}
          className="block rounded-3xl border border-border/60 bg-background/40 p-5 transition hover:bg-muted/30"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill tone="neutral">{alert.status}</StatusPill>
              <StatusPill tone={severityTone(alert.severity)}>{alert.severity}</StatusPill>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Rule: {alert.rule?.name ?? "System generated"} • {new Date(alert.createdAt).toLocaleString()}
            {alert.sourceSummary ? ` • ${alert.sourceSummary}` : ""}
          </div>
        </Link>
      ))}
    </div>
  );
}
