import { AutoPrintOnLoad } from "@/components/auto-print-on-load";
import { StatusPill } from "@/components/common";
import { requireUser } from "@/lib/session";
import { getTimelineWorkspaceData, type TimelineItem } from "@/lib/timeline";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function typeLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function PrintTimelineItem({ item }: { item: TimelineItem }) {
  return (
    <div className="break-inside-avoid rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <StatusPill tone={item.tone}>{typeLabel(item.type)}</StatusPill>
            <StatusPill tone={item.riskLevel === "urgent" ? "danger" : item.riskLevel === "watch" ? "warning" : "neutral"}>{item.riskLevel}</StatusPill>
          </div>
          <h3 className="font-semibold text-slate-950">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
        </div>
        <p className="whitespace-nowrap text-right text-xs text-slate-500">{formatDateTime(item.occurredAt)}</p>
      </div>
    </div>
  );
}

export default async function TimelinePrintPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const filters = {
    type: typeof params.type === "string" ? params.type : "all",
    tone: typeof params.tone === "string" ? params.tone : "all",
    q: typeof params.q === "string" ? params.q : "",
    from: typeof params.from === "string" ? params.from : "",
    to: typeof params.to === "string" ? params.to : "",
  };
  const autoprint = params.autoprint === "1";
  const data = await getTimelineWorkspaceData(user.id!, filters);

  return (
    <main className="min-h-screen bg-white p-8 text-slate-950 print:p-0">
      {autoprint ? <AutoPrintOnLoad /> : null}
      <div className="mx-auto max-w-5xl space-y-8 print:max-w-none">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">VitaVault</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Patient Timeline Packet</h1>
              <p className="mt-2 text-sm text-slate-600">Generated {formatDateTime(new Date())}</p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p>{data.summary.visibleItems} visible events</p>
              <p>{data.summary.urgentItems} urgent • {data.summary.watchItems} watch</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Events</p><p className="mt-1 text-2xl font-bold">{data.summary.visibleItems}</p></div>
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Urgent</p><p className="mt-1 text-2xl font-bold">{data.summary.urgentItems}</p></div>
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Watch</p><p className="mt-1 text-2xl font-bold">{data.summary.watchItems}</p></div>
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Types</p><p className="mt-1 text-2xl font-bold">{data.summary.recordTypesCovered}</p></div>
        </section>

        {data.groups.map((group) => (
          <section key={group.key} className="break-inside-avoid space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-xl font-semibold">{group.label}</h2>
              <p className="text-sm text-slate-500">{group.items.length} events{group.riskCount ? ` • ${group.riskCount} review` : ""}</p>
            </div>
            <div className="space-y-3">
              {group.items.map((item) => <PrintTimelineItem key={`${item.type}-${item.id}`} item={item} />)}
            </div>
          </section>
        ))}

        {data.visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">No timeline items matched the selected filters.</div>
        ) : null}
      </div>
    </main>
  );
}
