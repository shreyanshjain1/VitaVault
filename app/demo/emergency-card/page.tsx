import { DemoHeader, DemoSection, BulletList, KeyValueList } from "@/components/demo-primitives";
import { demoEmergencyCardHub } from "@/lib/demo-data";

export default function DemoEmergencyCardPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Reports" title="Emergency Health Card demo" description="A print-friendly emergency snapshot for allergies, conditions, medications, contacts, and latest vital context." />
      <DemoSection title="Emergency profile"><KeyValueList items={demoEmergencyCardHub.profile} /></DemoSection>
      <DemoSection title="Critical details"><BulletList items={demoEmergencyCardHub.critical} /></DemoSection>
    </div>
  );
}
