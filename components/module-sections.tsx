import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export function ModuleHero({
  eyebrow,
  title,
  description,
  stats,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  stats?: Array<{ label: string; value: string | number; hint?: string }>;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
        <div className="p-6">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="border-t border-border/60 bg-background/40 p-6 lg:border-l lg:border-t-0">
          {stats?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-background/50 p-4"
                >
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                  {stat.hint ? (
                    <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">
                No summary metrics available yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ModuleFormCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ModuleListCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DataCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-border/60 bg-background/40 p-5",
        className
      )}
    >
      {children}
    </div>
  );
}