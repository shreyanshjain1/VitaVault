"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MoonStar, Sparkles, SunMedium } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { primaryRoutes, utilityRoutes } from "@/lib/app-routes";

type AppShellProps = {
  children: React.ReactNode;
};

function navLinkClasses(active: boolean) {
  return [
    "group flex items-start gap-3 rounded-2xl border px-3 py-3 transition-all duration-200",
    active
      ? "border-zinc-950 bg-zinc-950 text-white shadow-sm dark:border-white dark:bg-white dark:text-black"
      : "border-zinc-200/80 bg-white/80 text-zinc-900 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
  ].join(" ");
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const activeTitle = useMemo(() => {
    const all = [...primaryRoutes, ...utilityRoutes];
    return all.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.title ?? "VitaVault";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(120,119,198,0.10),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom,_#f8fafc,_#f4f4f5)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(120,119,198,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(to_bottom,_#09090b,_#111827)] dark:text-zinc-50">
      <div className="mx-auto grid min-h-screen max-w-[1680px] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-zinc-200/70 bg-white/80 p-5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/70 lg:border-b-0 lg:border-r">
          <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-500">
                  VitaVault
                </p>
                <h1 className="mt-2 text-2xl font-semibold">Patient Workspace</h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Secure records, care-team collaboration, and AI-backed health summaries.
                </p>
              </div>

              <button
                type="button"
                className="rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-900/60 dark:bg-violet-950/30">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-violet-600 p-2 text-white dark:bg-violet-500">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Insights ready</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    Generate concise, patient-friendly summaries and follow-up talking points from existing records.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Main
              </p>
              <nav className="space-y-2">
                {primaryRoutes.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href} className={navLinkClasses(active)}>
                      <div
                        className={
                          active
                            ? "rounded-2xl bg-white/10 p-2 dark:bg-black/10"
                            : "rounded-2xl border border-zinc-200/80 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p
                          className={
                            active
                              ? "mt-1 text-xs text-white/80 dark:text-black/70"
                              : "mt-1 text-xs text-zinc-500 dark:text-zinc-400"
                          }
                        >
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Utility
              </p>
              <nav className="space-y-2">
                {utilityRoutes.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href} className={navLinkClasses(active)}>
                      <div
                        className={
                          active
                            ? "rounded-2xl bg-white/10 p-2 dark:bg-black/10"
                            : "rounded-2xl border border-zinc-200/80 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950"
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p
                          className={
                            active
                              ? "mt-1 text-xs text-white/80 dark:text-black/70"
                              : "mt-1 text-xs text-zinc-500 dark:text-zinc-400"
                          }
                        >
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Current section
              </p>
              <p className="mt-2 text-sm font-semibold">{activeTitle}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Your workspace is authenticated and protected by server-side session checks.
              </p>

              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-zinc-300 px-4 py-2.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}