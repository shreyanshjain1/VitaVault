import Link from "next/link";

const toneClasses: Record<string, string> = {
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300",
  neutral: "border-border/60 bg-background/70 text-foreground",
};

function inferTone(value: string) {
  const normalized = value.toLowerCase();
  if (["critical", "deactivated", "error", "failed", "revoked"].some((token) => normalized.includes(token))) return "danger";
  if (["warning", "due", "retry", "watch"].some((token) => normalized.includes(token))) return "warning";
  if (["active", "good", "ready", "verified", "succeeded", "up to date", "healthy", "configured"].some((token) => normalized.includes(token))) return "success";
  if (["pending", "monitor", "open", "queued", "info"].some((token) => normalized.includes(token))) return "info";
  return "neutral";
}

export function DemoHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-[28px] border border-border/60 bg-background/75 p-6 shadow-sm">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-2">
        <Link href="/demo/summary" className="rounded-2xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/60">Summary</Link>
        <Link href="/demo/admin" className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Admin view</Link>
      </div>
    </div>
  );
}

export function DemoSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-border/60 bg-background/75 p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function MetricGrid({ items }: { items: { label: string; value: string; note?: string }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-[28px] border border-border/60 bg-background/75 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
          {item.note ? <p className="mt-2 text-sm text-muted-foreground">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function KeyValueList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border/60 bg-background/60 p-4">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ToneBadge({ value }: { value: string }) {
  const tone = inferTone(value);
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>{value}</span>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-xs font-medium">{children}</span>;
}

export function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left">
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium text-muted-foreground">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/40 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-3 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
