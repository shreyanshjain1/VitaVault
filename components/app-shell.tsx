"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  MoonStar,
  Sparkles,
  SunMedium,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { primaryRoutes, utilityRoutes, type AppRouteItem } from "@/lib/app-routes";

type AppShellProps = {
  children: React.ReactNode;
};

function navItemClasses(active: boolean) {
  return cn(
    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all",
    "border border-transparent hover:border-border/60 hover:bg-muted/40",
    active &&
      "border-border/70 bg-muted/60 shadow-sm dark:bg-muted/30"
  );
}

function NavItem({ item, active, onNavigate }: { item: AppRouteItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={navItemClasses(active)} onClick={onNavigate}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-2xl border",
          active
            ? "border-border/70 bg-background/70"
            : "border-border/50 bg-background/40 group-hover:bg-background/70"
        )}
      >
        <Icon className={cn("h-4 w-4", active ? "text-foreground" : "text-muted-foreground")} />
      </span>
      <div className="min-w-0">
        <p className={cn("truncate text-sm font-medium", active ? "text-foreground" : "text-foreground/90")}>
          {item.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeTitle = useMemo(() => {
    const all = [...primaryRoutes, ...utilityRoutes];
    return (
      all.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      )?.title ?? "VitaVault"
    );
  }, [pathname]);

  const routeMap = useMemo(() => {
    const all = [...primaryRoutes, ...utilityRoutes];
    return new Map(all.map((r) => [r.href, r]));
  }, []);

  const groups = useMemo(() => {
    const pick = (hrefs: string[]) =>
      hrefs.map((h) => routeMap.get(h)).filter(Boolean) as AppRouteItem[];

    const overview = pick(["/dashboard"]);
    const collaboration = pick(["/ai-insights", "/care-team", "/alerts"]);
    const records = (primaryRoutes.filter(
      (r) =>
        !["/dashboard", "/ai-insights", "/care-team", "/alerts", "/summary"].includes(r.href)
    ) ?? []) as AppRouteItem[];
    const utilities = pick(["/summary", ...utilityRoutes.map((r) => r.href)]);

    return [
      { label: "Overview", items: overview },
      { label: "Flagship", items: collaboration },
      { label: "Records", items: records },
      { label: "Utilities", items: utilities },
    ];
  }, [routeMap]);

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <aside className="flex h-full w-full flex-col">
      <div className="px-4 pt-5">
        <Link href="/dashboard" className="group block" onClick={onNavigate}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight">
                  VitaVault
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Patient workspace
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Secure records, care-team collaboration, and AI-backed summaries.
          </p>
        </Link>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={active}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
              "border border-border/60 bg-background/60 hover:bg-muted/50"
            )}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <MoonStar className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium",
              "border border-border/60 bg-background/60 hover:bg-muted/50"
            )}
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Your workspace is authenticated and protected by server-side checks.
        </p>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop layout */}
      <div className="hidden min-h-screen lg:flex">
        <div className="w-[340px] border-r border-border/60 bg-background/70">
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>
        </div>

        <div className="flex min-h-screen flex-1 flex-col">
          <div className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Current section
                </p>
                <p className="text-sm font-semibold">{activeTitle}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Premium healthcare SaaS shell • Dark mode supported
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/60"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-semibold">{activeTitle}</p>
              <p className="truncate text-xs text-muted-foreground">VitaVault</p>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/60"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunMedium className="h-4 w-4" />
              ) : (
                <MoonStar className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {children}

        {mobileOpen ? (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[88%] max-w-[360px] border-r border-border/60 bg-background">
              <div className="flex items-center justify-between px-4 py-4">
                <p className="text-sm font-semibold">Navigation</p>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/60"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(100%-64px)]">
                <Sidebar onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}