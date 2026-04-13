"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select } from "@/components/ui";

type DeviceConnectionOption = {
  id: string;
  label: string;
  source: string;
  status: string;
};

type Props = {
  deviceConnections: DeviceConnectionOption[];
  jobsAvailable?: boolean;
  unavailableReason?: string | null;
};

type DispatchState =
  | {
      loading: false;
      message: string | null;
      error: string | null;
    }
  | {
      loading: true;
      message: string | null;
      error: string | null;
    };

export function JobDispatchPanel({
  deviceConnections,
  jobsAvailable = true,
  unavailableReason = null,
}: Props) {
  const router = useRouter();
  const [selectedConnectionId, setSelectedConnectionId] = useState(deviceConnections[0]?.id ?? "");
  const [state, setState] = useState<DispatchState>({
    loading: false,
    message: null,
    error: null,
  });

  const hasConnections = useMemo(() => deviceConnections.length > 0, [deviceConnections]);
  const disabled = state.loading || !jobsAvailable;

  async function dispatch(payload: Record<string, unknown>) {
    if (!jobsAvailable) {
      setState({
        loading: false,
        message: null,
        error: unavailableReason ?? "Jobs are unavailable right now.",
      });
      return;
    }

    setState({
      loading: true,
      message: null,
      error: null,
    });

    try {
      const response = await fetch("/api/jobs/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        jobRunId?: string;
        syncJobId?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Unable to dispatch job.");
      }

      setState({
        loading: false,
        message: data.syncJobId
          ? `Job queued successfully. SyncJob: ${data.syncJobId}`
          : `Job queued successfully. JobRun: ${data.jobRunId ?? "created"}`,
        error: null,
      });

      router.refresh();
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : "Unable to dispatch job.",
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual dispatch</CardTitle>
        <CardDescription>
          Queue real jobs so the repo demonstrates worker-backed operational behavior.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!jobsAvailable ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            {unavailableReason ?? "Background jobs are unavailable right now."}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => dispatch({ jobType: "alert-evaluation" })}
            disabled={disabled}
          >
            {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Queue alert evaluation
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ jobType: "reminder-generation" })}
            disabled={disabled}
          >
            {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Queue reminder generation
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ jobType: "daily-health-summary" })}
            disabled={disabled}
          >
            {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Queue daily summary
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold">Device sync processing</h4>
            <p className="text-sm text-muted-foreground">
              Uses existing device connection + sync models and mirrors supported readings into vitals.
            </p>
          </div>

          {hasConnections ? (
            <div className="space-y-3">
              <Select
                value={selectedConnectionId}
                onChange={(e) => setSelectedConnectionId(e.target.value)}
                disabled={disabled}
              >
                {deviceConnections.map((connection) => (
                  <option key={connection.id} value={connection.id}>
                    {connection.label} • {connection.source} • {connection.status}
                  </option>
                ))}
              </Select>

              <Button
                type="button"
                onClick={() => dispatch({ jobType: "device-sync-processing", connectionId: selectedConnectionId })}
                disabled={disabled || !selectedConnectionId}
              >
                {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                Queue device sync
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No device connections available yet for this account.</p>
          )}
        </div>

        {state.message ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
            {state.message}
          </div>
        ) : null}

        {state.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {state.error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
