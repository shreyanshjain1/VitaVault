import { DemoHeader, DemoSection, ToneBadge } from "@/components/demo-primitives";
import { demoAiInsights } from "@/lib/demo-data";

export default function DemoAiInsightsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="AI Insights" description="Narrative summaries and action-oriented pattern detection over the patient's history." />
      <DemoSection title="Generated insights">
        <div className="space-y-3">
          {demoAiInsights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <ToneBadge value={item.severity} />
              </div>
              <p className="text-sm text-muted-foreground">{item.summary}</p>
            </div>
          ))}
        </div>
      </DemoSection>
    </div>
  );
}
