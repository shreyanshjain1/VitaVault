import { DemoHeader, DemoSection, MetricGrid, KeyValueList, ToneBadge, Badge } from "@/components/demo-primitives";
import { demoDashboardStats, demoPatient, demoAiInsights, demoAlerts, demoNav } from "@/lib/demo-data";

export default function DemoPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Explore VitaVault" description="A full no-login walkthrough of the product with realistic sample patient, admin, and ops data." />
      <MetricGrid items={demoDashboardStats} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DemoSection title="Patient snapshot" description="The demo uses a realistic chronic-care scenario so every VitaVault workflow has something meaningful to show.">
          <KeyValueList items={[
            { label: "Patient", value: demoPatient.name },
            { label: "Age / Sex", value: `${demoPatient.age} · ${demoPatient.sex}` },
            { label: "Blood type", value: demoPatient.bloodType },
            { label: "Conditions", value: demoPatient.chronicConditions.join(", ") },
            { label: "Allergies", value: demoPatient.allergies.join(", ") },
            { label: "Emergency contact", value: demoPatient.emergencyContact },
          ]} />
        </DemoSection>
        <DemoSection title="Feature coverage" description="Every main VitaVault area has a dedicated public demo page.">
          <div className="grid gap-2 sm:grid-cols-2">
            {demoNav.slice(1).map((item) => (
              <div key={item.href} className="rounded-2xl border border-border/60 bg-background/60 p-3">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.href}</p>
              </div>
            ))}
          </div>
        </DemoSection>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DemoSection title="AI insight preview" description="Shows the product's explanatory summaries and action guidance.">
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
        <DemoSection title="Alert preview" description="The demo includes open, acknowledged, and rule-driven events.">
          <div className="space-y-3">
            {demoAlerts.events.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="mb-2 flex flex-wrap gap-2">
                  <ToneBadge value={item.severity} />
                  <ToneBadge value={item.status} />
                  <Badge>{item.category}</Badge>
                </div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.source} · {item.createdAt}</p>
              </div>
            ))}
          </div>
        </DemoSection>
      </div>
    </div>
  );
}
