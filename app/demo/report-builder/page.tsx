import { DemoHeader, DemoSection, KeyValueList, SimpleTable, StatCards } from "@/components/demo-primitives";
import { demoReportBuilderHub } from "@/lib/demo-data";

export default function DemoReportBuilderPage() {
  return (
    <div className="space-y-6">
      <DemoHeader
        eyebrow="Export workflow"
        title="Report Builder"
        description="A read-only preview of VitaVault's custom report packet workflow for doctor visits, emergency summaries, care-team handoffs, and device review exports."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <DemoSection title="Packet readiness checks" description="The real report builder uses record availability and safety context to make report exports more useful.">
          <KeyValueList items={demoReportBuilderHub.checks} />
        </DemoSection>
        <DemoSection title="Reviewer signal">
          <StatCards
            items={[
              {
                title: "Saved report history",
                body: "Generated packets can be tracked as saved report records instead of disappearing after export.",
                status: "Persisted",
              },
              {
                title: "Multiple audiences",
                body: "The same health record can produce clinician, caregiver, emergency, and operations-oriented packets.",
                status: "Flexible",
              },
            ]}
          />
        </DemoSection>
      </div>

      <DemoSection title="Report presets">
        <SimpleTable
          headers={["Preset", "Audience", "Sections", "Status"]}
          rows={demoReportBuilderHub.presets.map((preset) => ({
            key: preset.name,
            cells: [preset.name, preset.audience, preset.sections, preset.status],
          }))}
        />
      </DemoSection>

      <DemoSection title="Saved report history">
        <SimpleTable
          headers={["Report", "Generated", "Format", "Status"]}
          rows={demoReportBuilderHub.history.map((report) => ({
            key: `${report.title}-${report.generatedAt}`,
            cells: [report.title, report.generatedAt, report.format, report.status],
          }))}
        />
      </DemoSection>
    </div>
  );
}
