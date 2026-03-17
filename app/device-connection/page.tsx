import Link from "next/link";
import {
  Activity,
  BellRing,
  Bluetooth,
  HeartPulse,
  Lock,
  Scale,
  ShieldCheck,
  Smartphone,
  Watch,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, StatusPill } from "@/components/common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

type IntegrationStatus = "planned" | "beta" | "sponsor" | "future";

type IntegrationItem = {
  title: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  icon: React.ComponentType<{ className?: string }>;
  bullets: string[];
};

const integrations: IntegrationItem[] = [
  {
    title: "Apple Health",
    category: "iPhone / iOS",
    description:
      "Future import path for steps, heart rate, weight, blood pressure, and other HealthKit-backed readings.",
    status: "sponsor",
    icon: Smartphone,
    bullets: [
      "Would require iOS companion / approved integration work",
      "Good sponsor-facing roadmap item",
      "Designed as read-only ingestion first",
    ],
  },
  {
    title: "Android Health Connect",
    category: "Android",
    description:
      "Future sync path for supported Android wellness and health records through Health Connect.",
    status: "planned",
    icon: Smartphone,
    bullets: [
      "Strong practical direction for Android users",
      "Good first-party mobile-linked ingestion path",
      "Could later map into alert rules",
    ],
  },
  {
    title: "Fitbit",
    category: "Wearable cloud",
    description:
      "Future wearable sync for activity, heart rate, sleep-related indicators, and trend overlays.",
    status: "future",
    icon: Watch,
    bullets: [
      "Cloud vendor integration path",
      "Useful for sponsor demos",
      "Should be clearly labeled as optional",
    ],
  },
  {
    title: "Blood Pressure Monitor",
    category: "Home device",
    description:
      "Planned support for imported or synced BP readings with source-aware provenance.",
    status: "beta",
    icon: HeartPulse,
    bullets: [
      "Can start with manual import UX",
      "Later support bluetooth/cloud vendor bridges",
      "Best candidate for threshold alerts",
    ],
  },
  {
    title: "Smart Scale",
    category: "Home device",
    description:
      "Future weight sync with gradual trend monitoring and adherence context.",
    status: "planned",
    icon: Scale,
    bullets: [
      "Supports trend visualization well",
      "Low-friction path for chronic care use cases",
      "Pairs well with AI summaries",
    ],
  },
  {
    title: "Pulse Oximeter",
    category: "Home device",
    description:
      "Future oxygen saturation ingestion for respiratory monitoring workflows.",
    status: "sponsor",
    icon: Activity,
    bullets: [
      "High-value for caregiver alerts later",
      "Requires careful non-diagnostic messaging",
      "Should preserve source metadata and timestamps",
    ],
  },
];

function statusTone(status: IntegrationStatus) {
  switch (status) {
    case "beta":
      return "info";
    case "planned":
      return "warning";
    case "sponsor":
      return "danger";
    case "future":
      return "neutral";
    default:
      return "neutral";
  }
}

function statusLabel(status: IntegrationStatus) {
  switch (status) {
    case "beta":
      return "Beta foundation";
    case "planned":
      return "Planned";
    case "sponsor":
      return "Requires sponsor";
    case "future":
      return "Coming later";
    default:
      return "Planned";
  }
}

export default function DeviceConnectionsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Device Connections"
          description="A sponsor-friendly integration roadmap showing how VitaVault can grow into phone-linked and device-assisted health monitoring without overstating current capabilities."
          action={
            <Link
              href="/alerts"
              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium hover:bg-muted/50"
            >
              Open Alert Center
            </Link>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Integration roadmap</CardTitle>
                  <CardDescription className="mt-1">
                    These are intentionally visible as roadmap items so the product feels credible in client and sponsor demos.
                  </CardDescription>
                </div>
                <StatusPill tone="info">Roadmap surface</StatusPill>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {integrations.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[28px] border border-border/60 bg-background/40 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                        </div>

                        <StatusPill tone={statusTone(item.status)}>
                          {statusLabel(item.status)}
                        </StatusPill>
                      </div>

                      <p className="mt-4 text-sm text-muted-foreground">
                        {item.description}
                      </p>

                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        {item.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary/70" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-5 flex items-center gap-2">
                        <button
                          type="button"
                          disabled
                          className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground opacity-70"
                        >
                          Not active yet
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Architecture direction</CardTitle>
                <CardDescription className="mt-1">
                  Designed now so later integrations slot in cleanly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-3">
                    <Bluetooth className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Connection layer</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Future `device_connections` records can track source, status, account linkage, and last sync metadata.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-3">
                    <HeartPulse className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Reading provenance</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Future `device_readings` should store source type, captured timestamp, normalized values, and original metadata.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center gap-3">
                    <BellRing className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Alert readiness</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Imported readings can later trigger threshold and trend-based alerts without changing the dashboard model again.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product safety</CardTitle>
                <CardDescription className="mt-1">
                  Roadmap visible, but not misleading.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Every roadmap card is clearly disabled and labeled as not active yet.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Future sync features should preserve auditability, permission checks, and source visibility.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Watch className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Device data should remain informational and non-diagnostic unless clinically validated workflows are added later.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}