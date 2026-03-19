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
      {alerts.map((alert: AlertItem) => (
        <Link
          key={alert.id}
          href={`/alerts/${alert.id}?ownerUserId=${ownerUserId}`}
          className="block rounded-3xl border border-border/60 bg-background/40 p-5 transition hover:bg-muted/30"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill tone="neutral">{alert.status}</StatusPill>
              <StatusPill tone="info">{alert.severity}</StatusPill>
            </div>
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Rule: {alert.rule?.name ?? "System generated"} • {new Date(alert.createdAt).toLocaleString()}
          </div>
        </Link>
      ))}
    </div>
  );
}