import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getPatientTimeline } from "@/lib/timeline";

export default async function TimelinePage() {
  const currentUser = await requireUser();
  const items = await getPatientTimeline(currentUser.id!, 80);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Patient timeline"
          description="A unified chronological view across appointments, labs, vitals, symptoms, medication activity, reminders, documents, vaccinations, and alerts."
          action={
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
              >
                Back to dashboard
              </Link>
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Longitudinal activity feed</CardTitle>
            <CardDescription>
              This view is meant to reduce record-hopping and make follow-up faster.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="rounded-3xl border border-border/60 bg-background/40 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <StatusPill tone={item.tone}>{item.type.replaceAll("_", " ")}</StatusPill>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleString()}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
                    >
                      Open module
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">
                No timeline activity yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
