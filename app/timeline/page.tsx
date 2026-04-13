import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { getTimelineItems } from "@/lib/timeline";

export default async function TimelinePage() {
  const user = await requireUser();
  const items = await getTimelineItems(user.id!);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <PageHeader
          title="Patient timeline"
          description="A single chronological view of appointments, labs, vitals, symptoms, medications, reminders, and documents."
          action={<Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50">Back to dashboard</Link>}
        />

        <Card>
          <CardHeader>
            <CardTitle>Recent history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length ? (
              items.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.href} className="block rounded-3xl border border-border/60 bg-background/40 p-5 transition hover:bg-muted/30">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill tone={item.tone}>{item.type.replaceAll("_", " ")}</StatusPill>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleString()}</div>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 p-5 text-sm text-muted-foreground">No timeline items yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
