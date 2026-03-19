import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";

const placeholderAlert = {
  id: "placeholder",
  title: "Alert details unavailable",
  message:
    "The alert detail model is not active in the current schema, so this page is using a safe placeholder view.",
  auditLogs: [] as Array<{
    id: string;
    action: string;
    createdAt: Date;
    note?: string | null;
    metadataJson?: string | null;
  }>,
};

export default async function AlertDetailPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUser();
  const query = (await searchParams) ?? {};
  const ownerUserId =
    typeof query.ownerUserId === "string" && query.ownerUserId
      ? query.ownerUserId
      : currentUser.id!;

  const alert = placeholderAlert;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title={alert.title}
          description={alert.message}
          action={
            <Link
              href={`/alerts?ownerUserId=${ownerUserId}`}
              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
            >
              Back to alerts
            </Link>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Audit trail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alert.auditLogs.length ? (
              alert.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="font-medium text-foreground">{log.action}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No audit entries yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}