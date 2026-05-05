import { DemoHeader, DemoSection, ProgressBar, SimpleTable, StatCards, ToneBadge } from "@/components/demo-primitives";
import { demoMedicationSafetyHub } from "@/lib/demo-data";

export default function DemoMedicationSafetyPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Clinical review" title="Medication Safety demo" description="Dose board, adherence signals, safety tasks, reminders, and provider-linked medication review in one workspace." />
      <DemoSection title="Medication safety readiness"><ProgressBar value={demoMedicationSafetyHub.readiness} label="Medication safety readiness" /></DemoSection>
      <DemoSection title="Today's dose board">
        <SimpleTable headers={["Medication", "Schedule", "Status", "Adherence"]} rows={demoMedicationSafetyHub.doseBoard.map((item) => [item.medication, item.time, <ToneBadge key={item.medication} value={item.status} />, item.adherence])} />
      </DemoSection>
      <DemoSection title="Safety action queue"><StatCards items={demoMedicationSafetyHub.actions.map((item) => ({ title: item.title, body: item.detail, status: item.priority }))} /></DemoSection>
    </div>
  );
}
