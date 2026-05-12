import { BulletList, DemoHeader, DemoSection, MetricGrid, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoCareNotesHub } from "@/lib/demo-data";

export default function DemoCareNotesPage() {
  return (
    <div className="space-y-6">
      <DemoHeader
        eyebrow="Collaboration layer"
        title="Care Notes"
        description="Shared handoff notes show how VitaVault connects caregivers, clinicians, admins, and patient records without turning collaboration into scattered comments."
      />

      <MetricGrid items={demoCareNotesHub.metrics} />

      <DemoSection title="Shared handoff board" description="Representative notes from the real care-note workflow, including status, author context, and the record areas they support.">
        <SimpleTable
          headers={["Note", "Category", "Author", "Status", "Detail"]}
          rows={demoCareNotesHub.notes.map((note) => ({
            key: `${note.title}-${note.author}`,
            cells: [note.title, note.category, note.author, note.status, note.detail],
          }))}
        />
      </DemoSection>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DemoSection title="Why this matters in the product">
          <BulletList items={demoCareNotesHub.workflow} />
        </DemoSection>
        <DemoSection title="Reviewer signal">
          <StatCards
            items={[
              {
                title: "Permission-aware collaboration",
                body: "Care notes are designed to respect shared-access scopes instead of exposing the entire patient workspace to every collaborator.",
                status: "Secure",
              },
              {
                title: "Workflow-connected notes",
                body: "Notes are most useful when they connect to alerts, reminders, reports, labs, symptoms, documents, and upcoming appointments.",
                status: "Workflow",
              },
            ]}
          />
        </DemoSection>
      </div>
    </div>
  );
}
