import Link from "next/link";
import { AlertEvent, AlertRule } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatusPill } from "@/components/common";
import {
  alertCategoryLabel,
  alertSeverityLabel,
  alertStatusLabel,
  alertSourceLabel,
} from "@/lib/alerts/constants";

type AlertRow = AlertEvent & {
  rule: AlertRule | null;
};

function severityTone(severity: AlertEvent["severity"]) {
  if (severity === "CRITICAL") return "danger";
  if (severity === "HIGH") return "warning";
  if (severity === "MEDIUM") return "info";
  return "neutral";
}

function statusTone(status: AlertEvent["status"]) {
  if (status === "OPEN") return "danger";
  if (status === "ACKNOWLEDGED") return "warning";
  if (status === "RESOLVED") return "success";
  return "neutral";
}

export function AlertList({
  alerts,
  ownerUserId,
}: {
  alerts: AlertRow[];
  ownerUserId: string;
}) {
  if (!alerts.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No alerts found</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Try adjusting filters or run a scheduled scan after adding rules.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {alerts.map((alert) => (
        <Link key={alert.id} href={`/alerts/${alert.id}?ownerUserId=${ownerUserId}`}>
          <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">{alert.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <StatusPill tone={severityTone(alert.severity)}>
                    {alertSeverityLabel[alert.severity]}
                  </StatusPill>
                  <StatusPill tone={statusTone(alert.status)}>
                    {alertStatusLabel[alert.status]}
                  </StatusPill>
                  <StatusPill tone="neutral">
                    {alertCategoryLabel[alert.category]}
                  </StatusPill>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
              <div>
                <span className="font-medium text-foreground">Rule:</span>{" "}
                {alert.rule?.name ?? "Ad hoc"}
              </div>
              <div>
                <span className="font-medium text-foreground">Source:</span>{" "}
                {alert.sourceType ? alertSourceLabel[alert.sourceType] ?? alert.sourceType : "Unknown"}
              </div>
              <div>
                <span className="font-medium text-foreground">Created:</span>{" "}
                {new Date(alert.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-foreground">Care team:</span>{" "}
                {alert.visibleToCareTeam ? "Visible" : "Hidden"}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
