"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, Sparkles } from "lucide-react";
import { demoNavGroups, demoReviewerCtas } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(to_bottom,_rgba(255,255,255,0.8),_rgba(248,250,252,1))]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-border/60 bg-background/80 px-5 py-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">VitaVault Demo</p>
              <p className="text-sm text-muted-foreground">Explore the product with sample records and read-only workflows.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium"><Sparkles className="h-3.5 w-3.5" /> Demo data only</span>
            {demoReviewerCtas.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-medium",
                  action.variant === "primary"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/60 hover:bg-muted/60",
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-border/60 bg-background/75 p-3 shadow-sm backdrop-blur">
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
              <div className="mb-3 rounded-2xl border border-sky-200/50 bg-sky-50/70 p-3 text-sm text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                Browse the full VitaVault flow with sample patient data. Nothing here writes to the database.
              </div>
              <nav className="space-y-4" aria-label="Public demo navigation">
                {demoNavGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <div className="px-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{group.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{group.description}</p>
                    </div>
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "block rounded-2xl px-3 py-2 transition",
                            active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted/60",
                          )}
                        >
                          <div className="text-sm font-medium">{item.label}</div>
                          {item.description ? (
                            <div className={cn("text-xs", active ? "text-primary-foreground/85" : "text-muted-foreground")}>
                              {item.description}
                            </div>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
