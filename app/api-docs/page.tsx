import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  KeyRound,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Workflow,
} from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";

const baseUrl = "https://your-vitavault-domain.com";

const endpointGroups = [
  {
    title: "Mobile authentication",
    description: "Credential login creates a hashed bearer-token session for Android/mobile clients.",
    icon: KeyRound,
    endpoints: [
      {
        method: "POST",
        path: "/api/mobile/auth/login",
        auth: "Public credentials",
        purpose: "Validate email/password and issue a mobile bearer token.",
      },
      {
        method: "GET",
        path: "/api/mobile/auth/me",
        auth: "Bearer token",
        purpose: "Validate the current mobile session and return the signed-in user.",
      },
      {
        method: "POST",
        path: "/api/mobile/auth/logout",
        auth: "Bearer token",
        purpose: "Revoke the current mobile token.",
      },
    ],
  },
  {
    title: "Device connections",
    description: "Expose the connected phone/device sync records attached to the authenticated user.",
    icon: Smartphone,
    endpoints: [
      {
        method: "GET",
        path: "/api/mobile/connections",
        auth: "Bearer token",
        purpose: "List device connections, platform, source, status, sync time, and error state.",
      },
    ],
  },
  {
    title: "Device reading ingestion",
    description: "Accept mobile/device readings and mirror supported readings into the vitals timeline.",
    icon: DatabaseZap,
    endpoints: [
      {
        method: "POST",
        path: "/api/mobile/device-readings",
        auth: "Bearer token",
        purpose: "Upsert the device connection, persist raw readings, create a sync job, and mirror supported vitals.",
      },
    ],
  },
];

const supportedReadings = [
  ["HEART_RATE", "valueInt", "Mirrors into heartRate"],
  ["BLOOD_PRESSURE", "systolic + diastolic", "Mirrors into systolic/diastolic"],
  ["OXYGEN_SATURATION", "valueInt", "Mirrors into oxygenSaturation"],
  ["WEIGHT", "valueFloat", "Mirrors into weightKg"],
  ["BLOOD_GLUCOSE", "valueFloat", "Mirrors into bloodSugar"],
  ["TEMPERATURE", "valueFloat", "Mirrors into temperatureC"],
  ["STEPS", "valueInt", "Stored as device reading only"],
  ["SLEEP_MINUTES", "valueInt or metadata", "Stored as device reading only"],
];

const loginRequest = `POST ${baseUrl}/api/mobile/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "correct-horse-battery-staple",
  "deviceName": "Rey's Android Phone"
}`;

const loginResponse = `{
  "token": "vvm_9f9f...mobile_token...",
  "expiresAt": "2026-07-28T08:30:00.000Z",
  "user": {
    "id": "user_123",
    "email": "patient@example.com",
    "name": "Rey Patient"
  }
}`;

const meRequest = `GET ${baseUrl}/api/mobile/auth/me
Authorization: Bearer vvm_9f9f...mobile_token...`;

const connectionResponse = `{
  "connections": [
    {
      "id": "connection_123",
      "source": "MOBILE_APP",
      "platform": "ANDROID",
      "clientDeviceId": "android-pixel-8-pro",
      "deviceLabel": "Pixel 8 Pro",
      "appVersion": "1.0.0",
      "status": "ACTIVE",
      "lastSyncedAt": "2026-04-29T08:40:00.000Z",
      "lastError": null,
      "createdAt": "2026-04-29T08:00:00.000Z",
      "updatedAt": "2026-04-29T08:40:00.000Z"
    }
  ]
}`;

const readingsRequest = `POST ${baseUrl}/api/mobile/device-readings
Authorization: Bearer vvm_9f9f...mobile_token...
Content-Type: application/json

{
  "source": "MOBILE_APP",
  "platform": "ANDROID",
  "clientDeviceId": "android-pixel-8-pro",
  "deviceLabel": "Pixel 8 Pro",
  "appVersion": "1.0.0",
  "scopes": ["vitals:write", "device:sync"],
  "syncMetadata": {
    "batteryLevel": 88,
    "network": "wifi"
  },
  "readings": [
    {
      "readingType": "HEART_RATE",
      "capturedAt": "2026-04-29T08:35:00.000Z",
      "clientReadingId": "hr-001",
      "unit": "bpm",
      "valueInt": 78
    },
    {
      "readingType": "BLOOD_PRESSURE",
      "capturedAt": "2026-04-29T08:36:00.000Z",
      "clientReadingId": "bp-001",
      "unit": "mmHg",
      "systolic": 118,
      "diastolic": 76
    },
    {
      "readingType": "WEIGHT",
      "capturedAt": "2026-04-29T08:37:00.000Z",
      "clientReadingId": "weight-001",
      "unit": "kg",
      "valueFloat": 71.4
    }
  ]
}`;

const readingsResponse = `{
  "success": true,
  "connection": {
    "id": "connection_123",
    "source": "MOBILE_APP",
    "platform": "ANDROID",
    "clientDeviceId": "android-pixel-8-pro",
    "deviceLabel": "Pixel 8 Pro",
    "status": "ACTIVE"
  },
  "sync": {
    "syncJobId": "sync_123",
    "requestedCount": 3,
    "acceptedCount": 3,
    "mirroredCount": 3,
    "duplicateCount": 0
  }
}`;

const errorExamples = `400 Invalid payload
{
  "error": "Invalid device reading payload.",
  "details": {
    "fieldErrors": {
      "readings": ["Array must contain at least 1 element(s)"]
    }
  }
}

401 Unauthorized
{
  "error": "Unauthorized mobile session."
}

500 Server error
{
  "error": "Unable to ingest device readings."
}`;

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-3xl border border-border/60 bg-slate-950 p-5 text-xs leading-6 text-slate-100 shadow-sm">
      <code>{code}</code>
    </pre>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <Badge className="font-mono text-[11px] uppercase tracking-wide">
      {method}
    </Badge>
  );
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to demo
            </Link>
            <div className="space-y-3">
              <Badge className="w-fit">
                <ServerCog className="h-3.5 w-3.5" />
                Mobile and device API surface
              </Badge>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
                VitaVault mobile sync and connected-device API documentation
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                A product-facing reference for the existing mobile authentication,
                bearer-token sessions, device connection listing, and device
                reading ingestion endpoints used by Android/mobile clients.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:w-[460px]">
            <div className="rounded-3xl border border-border/60 bg-background/60 p-4">
              <p className="text-2xl font-semibold">5</p>
              <p className="text-xs text-muted-foreground">documented endpoints</p>
            </div>
            <div className="rounded-3xl border border-border/60 bg-background/60 p-4">
              <p className="text-2xl font-semibold">8</p>
              <p className="text-xs text-muted-foreground">reading types</p>
            </div>
            <div className="rounded-3xl border border-border/60 bg-background/60 p-4">
              <p className="text-2xl font-semibold">90d</p>
              <p className="text-xs text-muted-foreground">token lifetime</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {endpointGroups.map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.title}>
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{group.title}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.endpoints.map((endpoint) => (
                    <div
                      key={`${endpoint.method}-${endpoint.path}`}
                      className="rounded-3xl border border-border/60 bg-background/55 p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <MethodBadge method={endpoint.method} />
                        <code className="text-xs font-semibold text-foreground">
                          {endpoint.path}
                        </code>
                      </div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Auth: {endpoint.auth}
                      </p>
                      <p className="text-sm leading-6">{endpoint.purpose}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Auth flow
              </CardTitle>
              <CardDescription>
                Mobile clients use the same account credentials but receive a
                separate revocable token for API access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                "Client posts email, password, and optional deviceName to /api/mobile/auth/login.",
                "The server validates credentials and stores only a SHA-256 hash of the raw mobile token.",
                "The raw token is returned once to the client and should be stored securely on-device.",
                "All protected mobile routes require Authorization: Bearer <token>.",
                "Logout revokes the active token without affecting the normal web session.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-3xl border border-border/60 bg-background/55 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-6">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endpoint matrix</CardTitle>
              <CardDescription>
                Quick implementation map for mobile, QA, and future Postman collection work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-3xl border border-border/60">
                <Table>
                  <THead>
                    <TR>
                      <TH>Method</TH>
                      <TH>Route</TH>
                      <TH>Auth</TH>
                      <TH>Purpose</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {endpointGroups.flatMap((group) => group.endpoints).map((endpoint) => (
                      <TR key={`${endpoint.method}-${endpoint.path}`}>
                        <TD><MethodBadge method={endpoint.method} /></TD>
                        <TD><code className="text-xs">{endpoint.path}</code></TD>
                        <TD>{endpoint.auth}</TD>
                        <TD>{endpoint.purpose}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Login request
              </CardTitle>
              <CardDescription>
                Call this first to obtain the mobile bearer token.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={loginRequest} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Login response</CardTitle>
              <CardDescription>
                The token is only returned once. Store it securely on the mobile client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={loginResponse} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-primary" />
                Current user request
              </CardTitle>
              <CardDescription>
                Lightweight token validation for app launch/session restore.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={meRequest} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Connections response
              </CardTitle>
              <CardDescription>
                Useful for a mobile settings screen or connected-device status card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={connectionResponse} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Device readings sync request
              </CardTitle>
              <CardDescription>
                One request can submit many readings from the same device and sync cycle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={readingsRequest} />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync response</CardTitle>
                <CardDescription>
                  Returns connection info plus the sync result counters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={readingsResponse} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-primary" />
                  Ingestion behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  The API upserts a device connection, creates a sync job, deduplicates readings by client reading id or captured value signature, stores raw device readings, and mirrors supported reading types into VitaVault vitals.
                </p>
                <p>
                  This keeps the raw mobile/device payload available while still making important vitals visible in the normal patient record timeline.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Supported reading types
            </CardTitle>
            <CardDescription>
              The current API accepts these device reading types. Several are mirrored into normal vitals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-3xl border border-border/60">
              <Table>
                <THead>
                  <TR>
                    <TH>Reading type</TH>
                    <TH>Required value</TH>
                    <TH>VitaVault behavior</TH>
                  </TR>
                </THead>
                <TBody>
                  {supportedReadings.map(([type, required, behavior]) => (
                    <TR key={type}>
                      <TD><code className="text-xs font-semibold">{type}</code></TD>
                      <TD>{required}</TD>
                      <TD>{behavior}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Error responses</CardTitle>
              <CardDescription>
                Common response shapes for mobile client handling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock code={errorExamples} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Security notes</CardTitle>
              <CardDescription>
                Product-facing guardrails for future mobile implementation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                "Use HTTPS only in production.",
                "Store the mobile token in secure device storage, not local plaintext.",
                "Treat mobile tokens separately from browser sessions.",
                "Rotate/revoke tokens from the security center when a device is lost.",
                "Keep reading payloads minimal and avoid sending unnecessary PHI.",
                "Add rate limiting before exposing the endpoints publicly at scale.",
              ].map((note) => (
                <div key={note} className="rounded-3xl border border-border/60 bg-background/55 p-4 text-sm leading-6">
                  {note}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <footer className="rounded-[2rem] border border-border/60 bg-card/80 p-6 text-sm leading-7 text-muted-foreground">
          <p>
            This page documents the current VitaVault API foundation. It is meant for product review, mobile planning, QA, and future Postman/OpenAPI expansion. The API surface is intentionally small today, but it already supports credential login, revocable mobile sessions, connected-device visibility, and structured reading ingestion.
          </p>
        </footer>
      </div>
    </main>
  );
}
