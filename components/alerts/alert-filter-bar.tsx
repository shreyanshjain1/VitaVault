import Link from "next/link";
import { Button, Select } from "@/components/ui";

export function AlertFilterBar({
  status,
  severity,
  category,
}: {
  status: string;
  severity: string;
  category: string;
}) {
  return (
    <form className="grid gap-3 rounded-3xl border border-border/60 bg-background/80 p-4 md:grid-cols-4">
      <Select name="status" defaultValue={status}>
        <option value="ALL">All statuses</option>
        <option value="OPEN">Open</option>
        <option value="ACKNOWLEDGED">Acknowledged</option>
        <option value="RESOLVED">Resolved</option>
        <option value="DISMISSED">Dismissed</option>
      </Select>
      <Select name="severity" defaultValue={severity}>
        <option value="ALL">All severities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </Select>
      <Select name="category" defaultValue={category}>
        <option value="ALL">All categories</option>
        <option value="VITAL_THRESHOLD">Vital threshold</option>
        <option value="MEDICATION_ADHERENCE">Medication adherence</option>
        <option value="SYMPTOM_SEVERITY">Symptom severity</option>
        <option value="SYNC_HEALTH">Sync health</option>
      </Select>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply filters
        </Button>
        <Link
          href="/alerts"
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
