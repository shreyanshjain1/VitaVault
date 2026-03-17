import * as React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed border-border/60 bg-background/40">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
  className?: string;
}) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
      : tone === "warning"
      ? "border-amber-200/70 bg-amber-50/70 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
      : tone === "danger"
      ? "border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
      : tone === "info"
      ? "border-sky-200/70 bg-sky-50/70 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200"
      : "border-border/60 bg-background/60 text-foreground/80";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses,
        className
      )}
    >
      {children}
    </span>
  );
}