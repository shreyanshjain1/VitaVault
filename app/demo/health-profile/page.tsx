import { BulletList, DemoHeader, DemoSection, KeyValueList, MetricGrid, StatCards } from "@/components/demo-primitives";
import { demoPatient } from "@/lib/demo-data";

export default function DemoHealthProfilePage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Patient identity and baseline" title="Health Profile" description="This mirrors VitaVault’s health profile page with patient basics, contact context, risk factors, and baseline measurements using safe hardcoded demo data." />
      <MetricGrid items={[
        { label: "Age", value: String(demoPatient.age), note: demoPatient.sex },
        { label: "Blood type", value: demoPatient.bloodType, note: "Recorded and verified" },
        { label: "BMI", value: String(demoPatient.bmi), note: `${demoPatient.heightCm} cm · ${demoPatient.weightKg} kg` },
        { label: "Last updated", value: demoPatient.lastUpdated, note: "Profile review complete" },
      ]} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DemoSection title="Profile details">
          <KeyValueList items={[
            { label: "Full name", value: demoPatient.name },
            { label: "Email", value: demoPatient.email },
            { label: "Phone", value: demoPatient.phone },
            { label: "Emergency contact", value: demoPatient.emergencyContact },
            { label: "Address", value: demoPatient.address },
            { label: "Sex", value: demoPatient.sex },
          ]} />
        </DemoSection>
        <DemoSection title="Clinical baseline">
          <StatCards items={[
            { title: "Allergies", body: demoPatient.allergies.join(", "), status: "Watch" },
            { title: "Chronic conditions", body: demoPatient.chronicConditions.join(", "), status: "Monitor" },
            { title: "Risk framing", body: "Current records show stable blood pressure and improving diabetes control, with neuropathy monitoring still needed.", status: "Info" },
          ]} />
        </DemoSection>
      </div>
      <DemoSection title="Care instructions and notes">
        <BulletList items={[
          "Keep antihypertensive adherence above 95% and continue morning BP spot checks.",
          "Maintain quarterly endocrinology review cadence and annual eye screening coverage.",
          "Continue documenting tingling episodes with time, severity, and duration for rule-based review.",
        ]} />
      </DemoSection>
    </div>
  );
}
