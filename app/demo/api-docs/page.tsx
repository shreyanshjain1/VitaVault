import { DemoHeader, DemoSection, BulletList, SimpleTable } from "@/components/demo-primitives";
import { demoApiDocsHub } from "@/lib/demo-data";

export default function DemoApiDocsPage() {
  return (
    <div className="space-y-6">
      <DemoHeader eyebrow="Platform" title="Mobile and Device API Docs demo" description="A reviewer-friendly API reference preview for mobile sessions, bearer tokens, device connections, and reading ingestion." />
      <DemoSection title="Endpoint matrix"><SimpleTable headers={["Method", "Endpoint", "Purpose"]} rows={demoApiDocsHub.endpoints.map((item) => [item.method, item.path, item.purpose])} /></DemoSection>
      <DemoSection title="Security notes"><BulletList items={demoApiDocsHub.security} /></DemoSection>
    </div>
  );
}
