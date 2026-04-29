"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, HeartPulse, Menu, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { demoNav, demoTourSteps } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeIndex = useMemo(() => demoNav.findIndex((item) => item.href === pathname), [pathname]);
  const progress = activeIndex >= 0 ? Math.round(((activeIndex + 1) / demoNav.length) * 100) : 0;
  const nextItem = activeIndex >= 0 && activeIndex < demoNav.length - 1 ? demoNav[activeIndex + 1] : demoNav[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_34%),linear-gradient(to_bottom,_rgba(255,255,255,0.86),_rgba(248,250,252,1))]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-[28px] border border-border/60 bg-background/85 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <HeartPulse className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">VitaVault Demo</p>
                <p className="text-sm text-muted-foreground">Guided no-login tour using sample health records.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5" /> Demo data only
              </span>
              <Link href="/signup" className="hidden rounded-2xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/60 sm:inline-flex">Create account</Link>
              <Link href="/login" className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Open real app</Link>
              <button type="button" onClick={() => setMobileOpen((value) => !value)} className="inline-flex rounded-2xl border border-border/60 p-2 lg:hidden" aria-label="Toggle demo navigation">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Demo tour progress</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <Link href={nextItem.href} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted/60">
              <Activity className="h-4 w-4" /> Next: {nextItem.label}
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className={cn("rounded-[28px] border border-border/60 bg-background/80 p-3 shadow-sm backdrop-blur lg:block", mobileOpen ? "block" : "hidden")}>
            <div className="max-h-[calc(100vh-138px)] overflow-y-auto pr-1">
              <div className="mb-3 rounded-2xl border border-sky-200/50 bg-sky-50/70 p-3 text-sm text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
                <p className="font-medium">Reviewer route</p>
                <p className="mt-1 text-xs leading-5">{demoTourSteps.map((step) => step.title.replace(/^Start with the |^Open the |^Inspect |^Review /, "")).join(" → ")}</p>
              </div>
              <nav className="space-y-1">
                {demoNav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
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
              </nav>
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
