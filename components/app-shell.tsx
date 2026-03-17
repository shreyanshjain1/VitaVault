"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MoonStar, SunMedium } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { primaryRoutes, utilityRoutes } from "@/lib/app-routes";

type AppShellProps = {
  children: React.ReactNode;
};

function navLinkClasses(active: boolean) {
  return [
    "flex items-start gap-3 rounded-2xl border px-3 py-3 transition",
    active
      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
      : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800",
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
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b bg-white/90 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                VitaVault
              </p>
              <h1 className="mt-1 text-2xl font-semibold">Patient Workspace</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Secure records, care-team access, and AI-backed insights.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl border p-2 dark:border-zinc-800"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </button>
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
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
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
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
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

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold">Current section</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{activeTitle}</p>

              <button
                type="button"
                className="mt-4 inline-flex rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
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