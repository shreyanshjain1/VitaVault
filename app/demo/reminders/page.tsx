import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoReminders } from "@/lib/demo-data";

export default function DemoRemindersPage() {
  return (
    <div className="space-y-6">
      <DemoHeader title="Reminders" description="Scheduled reminders, delivery channels, and dispatch state across meds and follow-ups." />
      <DemoSection title="Reminder queue">
        <SimpleTable headers={["Reminder", "When", "Channel", "State"]} rows={demoReminders.map((item) => [item.title, item.when, item.channel, item.state])} />
      </DemoSection>
    </div>
  );
}
