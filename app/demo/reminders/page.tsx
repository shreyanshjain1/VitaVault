import { DemoHeader, DemoSection, SimpleTable } from "@/components/demo-primitives";
import { demoReminders } from "@/lib/demo-data";

export default function DemoRemindersPage() {
  const headers = ["Reminder", "When", "Channel", "State"];
  const rows = demoReminders.map((item, index) => ({
    key: `${item.title}-${index}`,
    cells: [item.title, item.when, item.channel, item.state],
  }));

  return (
    <div className="space-y-6">
      <DemoHeader
        title="Reminders"
        description="A read-only look at how reminder timing, delivery channels, and patient follow-up can be managed."
      />
      <DemoSection title="Reminder queue" description="Shows the rhythm of medication prompts and care follow-ups in one place.">
        <SimpleTable headers={headers} rows={rows} />
      </DemoSection>
    </div>
  );
}
