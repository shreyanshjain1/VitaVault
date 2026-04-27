import { ActionChips, DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoDashboardStats, demoTimeline, demoReminders, demoSummary, demoAlerts } from "@/lib/demo-data";

export default function DemoDashboardPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Patient command center" title="Dashboard" description="Get a quick picture of the patient record, with reminders, alerts, recent activity, and the main care priorities in one place." />
      <MetricGrid items={demoDashboardStats} />
      <StatCards items={[
        { title: "Clinical snapshot", body: demoSummary.snapshot, status: "Healthy" },
        { title: "Alert posture", body: `${demoAlerts.events.filter((item) => item.status === "OPEN").length} events still need follow-up across symptoms and thresholds.`, status: "Watch" },
        { title: "Today’s priorities", body: "Confirm medication adherence, review tingling symptom signal, and keep the eye screening schedule on track.", status: "Action" },
      ]} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DemoSection title="Recent timeline" description="Mirrors the real dashboard’s running patient activity feed.">
          <SimpleTable headers={["When", "Type", "Title", "Detail"]} rows={demoTimeline.map((item) => ({ key: `${item.at}-${item.title}`, cells: [item.at, item.type, item.title, item.detail] }))} />
        </DemoSection>
        <DemoSection title="Reminder center snapshot" description="Upcoming and recently dispatched nudges across medication and appointments.">
          <SimpleTable headers={["Reminder", "When", "Channel", "State"]} rows={demoReminders.map((item) => ({ key: `${item.title}-${item.when}`, cells: [item.title, item.when, item.channel, item.state] }))} />
        </DemoSection>
      </div>
      <DemoSection title="Demo-only actions" description="These mirror the real app action zones, but stay safely read-only here.">
        <ActionChips items={["Generate AI insight preview", "Open patient summary PDF", "Review alert center", "Jump to exports", "Inspect admin workspace"]} />
      </DemoSection>
    </div>
  );
}
