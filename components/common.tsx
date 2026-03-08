import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <Card className="border-dashed"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{description}</p></CardContent></Card>;
}
export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h2 className="text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{action ?? <div />}</div>;
}
