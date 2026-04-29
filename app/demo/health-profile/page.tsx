import { BulletList, DemoHeader, DemoSection, KeyValueList, MetricGrid, StatCards } from "@/components/demo-primitives";
import { demoPatient } from "@/lib/demo-data";

export default function DemoHealthProfilePage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Patient identity and baseline" title="Health Profile" description="See the patient basics, emergency details, baseline clinical context, and notes that set up the rest of the record." />
      <MetricGrid items={[
        { label: "Age", value: String(demoPatient.age), note: demoPatient.sex },
        { label: "Blood type", value: demoPatient.bloodType, note: "Recorded and verified" },
        { label: "BMI", value: String(demoPatient.bmi), note: `${demoPatient.heightCm} cm · ${demoPatient.weightKg} kg` },
        { label: "Last updated", value: demoPatient.lastUpdated, note: "Profile review complete" },
      ]} />
      <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
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
            { title: "Current focus", body: "Blood pressure is stable, diabetes control is improving, and recurring tingling is still being watched before the next specialist visit.", status: "Info" },
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
