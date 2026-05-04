"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  MoonStar,
  Sparkles,
  SunMedium,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  allAppRoutes,
  navigationSections,
  type AppRouteItem,
} from "@/lib/app-routes";

type AppShellProps = {
  children: React.ReactNode;
};

const SIDEBAR_STORAGE_KEY = "vitavault-sidebar-collapsed";

function navItemClasses(active: boolean, collapsed: boolean) {
  return cn(
    "group flex items-center rounded-2xl border transition-all duration-200",
    collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
    "border-transparent hover:border-border/60 hover:bg-muted/40",
    active && "border-border/70 bg-muted/60 shadow-sm dark:bg-muted/30"
  );
}

function NavItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: AppRouteItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={navItemClasses(active, collapsed)}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-colors",
          active
            ? "border-border/70 bg-background/70"
            : "border-border/50 bg-background/40 group-hover:bg-background/70"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            active ? "text-foreground" : "text-muted-foreground"
          )}
        />
      </span>

      <AnimatePresence initial={false}>
        {!collapsed ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
            className="min-w-0 overflow-hidden"
          >
            <p
              className={cn(
                "truncate text-sm font-medium",
                active ? "text-foreground" : "text-foreground/90"
              )}
            >
              {item.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {item.description}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      setDesktopCollapsed(saved === "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!hasMounted) return;
    try {
      window.localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        desktopCollapsed ? "1" : "0"
      );
    } catch {}
  }, [desktopCollapsed, hasMounted]);

  const activeRoute = useMemo(() => {
    return allAppRoutes.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
  }, [pathname]);

  const activeSection = useMemo(() => {
    return navigationSections.find((section) =>
      section.items.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
    );
  }, [pathname]);

  const activeTitle = activeRoute?.title ?? "VitaVault";

  const Sidebar = ({
    collapsed = false,
    onNavigate,
  }: {
    collapsed?: boolean;
    onNavigate?: () => void;
  }) => (
    <aside className="flex h-full w-full flex-col">
      <div className={cn("pt-5", collapsed ? "px-3" : "px-4")}>
        <Link href="/dashboard" className="group block" onClick={onNavigate}>
          <div
            className={cn(
              "flex items-center",
              collapsed ? "justify-center" : "justify-between gap-3"
            )}
          >
            <div
              className={cn(
                "flex items-center",
                collapsed ? "justify-center" : "gap-3"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>

              <AnimatePresence initial={false}>
                {!collapsed ? (
                  <motion.div
                    key="brand"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.18 }}
                    className="min-w-0"
                  >
                    <p className="truncate text-base font-semibold tracking-tight">
                      VitaVault
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Health command center
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!collapsed ? (
              <motion.p
                key="tagline"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="mt-3 text-xs leading-relaxed text-muted-foreground"
              >
                Records, monitoring, care-team workflows, reports, and operations in one organized workspace.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </Link>
      </div>

      <div className={cn("mt-6 flex-1 overflow-y-auto pb-6", collapsed ? "px-2" : "px-3")}>
        {navigationSections.map((section) => (
          <div key={section.label} className="mb-5">
            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.div
                  key={`${section.label}-title`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-2 pb-2"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.label}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
                    {section.description}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={active}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={cn("border-t border-border/60 py-4", collapsed ? "px-3" : "px-4")}>
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
              "border border-border/60 bg-background/60 hover:bg-muted/50 transition-colors"
            )}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <MoonStar className="h-4 w-4" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {!collapsed ? (
              <motion.button
                key="logout"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium",
                  "border border-border/60 bg-background/60 hover:bg-muted/50 transition-colors"
                )}
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.div
              key="security-note"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mt-3 rounded-2xl border border-border/60 bg-background/50 p-3"
            >
              <p className="text-xs font-medium text-foreground/90">
                {activeSection?.label ?? "Protected workspace"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {activeSection?.description ?? "Authenticated and protected by server-side checks."}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden min-h-screen lg:flex">
        <motion.div
          animate={{ width: desktopCollapsed ? 96 : 360 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="border-r border-border/60 bg-background/70"
        >
          <div className="sticky top-0 h-screen">
            <Sidebar collapsed={desktopCollapsed} />
          </div>
        </motion.div>

        <div className="flex min-h-screen flex-1 flex-col">
          <div className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/60 hover:bg-muted/50 transition-colors"
                  onClick={() => setDesktopCollapsed((prev) => !prev)}
                  aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {desktopCollapsed ? (
                    <ChevronsRight className="h-4 w-4" />
                  ) : (
                    <ChevronsLeft className="h-4 w-4" />
                  )}
                </button>

                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {activeSection?.label ?? "Current section"}
                  </p>
                  <p className="text-sm font-semibold">{activeTitle}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Organized healthcare workspace • Navigation grouped by workflow
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </div>

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
              <p className="truncate text-xs text-muted-foreground">
                {activeSection?.label ?? "VitaVault"}
              </p>
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

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          {children}
        </motion.div>

        <AnimatePresence>
          {mobileOpen ? (
            <div className="fixed inset-0 z-50">
              <motion.div
                className="absolute inset-0 bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />

              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute left-0 top-0 h-full w-[88%] max-w-[380px] border-r border-border/60 bg-background"
              >
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold">Navigation</p>
                    <p className="text-xs text-muted-foreground">Grouped by product workflow</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background/60"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close navigation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="h-[calc(100%-72px)]">
                  <Sidebar onNavigate={() => setMobileOpen(false)} />
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
