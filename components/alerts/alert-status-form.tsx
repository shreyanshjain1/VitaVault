import { changeAlertStatus } from "@/app/alerts/actions";
import { Button, Input } from "@/components/ui";

export function AlertStatusForm({
  alertId,
  disabled,
}: {
  alertId: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <form action={changeAlertStatus} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
        <input type="hidden" name="alertId" value={alertId} />
        <Input name="note" placeholder="Optional note for the audit trail" />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="status" value="ACKNOWLEDGED" variant="outline" disabled={disabled}>
            Acknowledge
          </Button>
          <Button type="submit" name="status" value="RESOLVED" disabled={disabled}>
            Resolve
          </Button>
          <Button type="submit" name="status" value="DISMISSED" variant="secondary" disabled={disabled}>
            Dismiss
          </Button>
        </div>
      </form>
    </div>
  );
}
