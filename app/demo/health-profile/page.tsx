import { DemoHeader, DemoSection, KeyValueList } from "@/components/demo-primitives";
import { demoPatient } from "@/lib/demo-data";

export default function DemoHealthProfilePage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Health Profile" description="Core demographic, risk, and emergency information that anchors the rest of VitaVault." />
      <DemoSection title="Patient details">
        <KeyValueList items={[
          { label: "Full name", value: demoPatient.name },
          { label: "Email", value: demoPatient.email },
          { label: "Phone", value: demoPatient.phone },
          { label: "Address", value: demoPatient.address },
          { label: "Blood type", value: demoPatient.bloodType },
          { label: "Emergency contact", value: demoPatient.emergencyContact },
          { label: "Height", value: `${demoPatient.heightCm} cm` },
          { label: "Weight", value: `${demoPatient.weightKg} kg` },
          { label: "BMI", value: String(demoPatient.bmi) },
          { label: "Allergies", value: demoPatient.allergies.join(", ") },
          { label: "Chronic conditions", value: demoPatient.chronicConditions.join(", ") },
          { label: "Last updated", value: demoPatient.lastUpdated },
        ]} />
      </DemoSection>
    </div>
  );
}
