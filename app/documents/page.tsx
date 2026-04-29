import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  FileSearch,
  FileText,
  Filter,
  Link2,
  PencilLine,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { deleteDocument, updateDocumentMetadata, uploadDocument } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { DataCard, ModuleFormCard, ModuleHero, ModuleListCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";
import { getFocusedCardClass } from "@/lib/record-focus";
import { getDocumentLinkSummary, serializeDocumentLinkKey } from "@/lib/document-links";
import {
  DOCUMENT_FILTERS,
  DOCUMENT_TYPE_LABELS,
  buildDocumentHub,
  filterDocumentsForHub,
  parseDocumentHubFilters,
} from "@/lib/document-hub";

const documentTypeOptions = [
  { value: "LAB_RESULT", label: "Lab Result" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "SCAN", label: "Imaging / Scan" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
  { value: "CERTIFICATE", label: "Consult Note / Certificate" },
  { value: "OTHER", label: "Other" },
] as const;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = (await searchParams) ?? {};
  const focus = typeof params.focus === "string" ? params.focus : undefined;
  const filters = parseDocumentHubFilters(params);

  const [documents, appointments, labs, doctors] = await Promise.all([
    db.medicalDocument.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.appointment.findMany({
      where: { userId: user.id },
      orderBy: { scheduledAt: "desc" },
      take: 12,
      select: { id: true, doctorName: true, clinic: true, scheduledAt: true, status: true },
    }),
    db.labResult.findMany({
      where: { userId: user.id },
      orderBy: { dateTaken: "desc" },
      take: 12,
      select: { id: true, testName: true, dateTaken: true, flag: true },
    }),
    db.doctor.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { id: true, name: true, specialty: true, clinic: true },
    }),
  ]);

  const hub = buildDocumentHub(documents);
  const visibleDocuments = filterDocumentsForHub(documents, filters);
  const latest = documents[0] ?? null;
  const linkSummaries = await Promise.all(
    visibleDocuments.map(async (document) => [
      document.id,
      await getDocumentLinkSummary(user.id, document.linkedRecordType, document.linkedRecordId),
    ] as const)
  );
  const linkMap = new Map(linkSummaries);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Documents"
            description="A protected medical file hub for uploads, linked clinical context, review readiness, and secure handoff preparation."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{documents.length} files</Badge>
                <Badge className="bg-background/70">{hub.linkedCount} linked</Badge>
                <Badge className="bg-background/70">{hub.readinessScore}% ready</Badge>
                <Badge className="bg-background/70">
                  {latest ? `Latest: ${formatDateTime(latest.createdAt)}` : "No uploads yet"}
                </Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Document intelligence"
            title="Turn uploaded files into review-ready clinical context"
            description="VitaVault now surfaces document quality, linking coverage, review gaps, and quick filters so the file library feels like a real health-record workspace instead of a static upload folder."
            stats={[
              { label: "Stored files", value: documents.length },
              { label: "Linked records", value: hub.linkedCount, hint: `${hub.unlinkedCount} still unlinked` },
              { label: "Readiness", value: `${hub.readinessScore}%`, hint: hub.readinessLabel },
              { label: "Review items", value: hub.reviewItems.length },
            ]}
          />
        </PageTransition>

        <PageTransition delay={0.06}>
          <div className="grid gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Protected delivery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">Secure</p>
                <p className="mt-1 text-xs text-muted-foreground">Files are served through protected download routes.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-primary" /> Link coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{hub.linkCoverage}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Documents connected to appointments, labs, or doctors.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileSearch className="h-4 w-4 text-primary" /> Notes coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{hub.notesCoverage}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Files with usable context notes.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Archive className="h-4 w-4 text-primary" /> Storage footprint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{hub.totalSizeLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">Across all stored medical files.</p>
              </CardContent>
            </Card>
          </div>
        </PageTransition>

        <PageTransition delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Review readiness
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  These checks help make uploaded documents easier to understand during doctor visits, caregiver review, and export preparation.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {hub.reviewItems.length ? (
                  hub.reviewItems.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {item.tone === "success" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          <p className="font-medium">{item.title}</p>
                        </div>
                        <StatusPill tone={item.tone}>{item.status}</StatusPill>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No review gaps" description="Your document library has strong linking and note coverage." />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" /> Library filters
                </CardTitle>
                <p className="text-sm text-muted-foreground">Search by title, filename, notes, type, link status, and readiness quality.</p>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" action="/documents">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="q" defaultValue={filters.q} className="pl-9" placeholder="Find prescriptions, labs, scans, notes..." />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select name="type" defaultValue={filters.type}>
                        <option value="ALL">All types</option>
                        {documentTypeOptions.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Link status</Label>
                      <Select name="link" defaultValue={filters.link}>
                        <option value="ALL">All documents</option>
                        <option value="LINKED">Linked only</option>
                        <option value="UNLINKED">Unlinked only</option>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Readiness</Label>
                    <Select name="quality" defaultValue={filters.quality}>
                      {DOCUMENT_FILTERS.quality.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit">Apply filters</Button>
                    <a className="inline-flex h-10 items-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium" href="/documents">
                      Reset
                    </a>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </PageTransition>

        <PageTransition delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Document mix</CardTitle>
              <p className="text-sm text-muted-foreground">A quick breakdown of the records stored in the library.</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {hub.typeBreakdown.map((type) => (
                  <div key={type.type} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs font-medium text-muted-foreground">{type.label}</p>
                    <p className="mt-1 text-2xl font-semibold">{type.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </PageTransition>

        <StaggerGroup delay={0.12}>
          <div className="grid gap-6 xl:grid-cols-[1.02fr_1.48fr]">
            <StaggerItem>
              <ModuleFormCard
                title="Upload document"
                description="Store a structured title, type, notes, source file, and an optional linked record."
              >
                <form action={uploadDocument} className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input name="title" required placeholder="Chest X-Ray Report" />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select name="type" defaultValue="OTHER">
                      {documentTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Link to existing record</Label>
                    <Select name="linkedRecordKey" defaultValue="">
                      <option value="">No linked record</option>
                      {appointments.length ? (
                        <optgroup label="Appointments">
                          {appointments.map((appointment) => (
                            <option key={appointment.id} value={`APPOINTMENT:${appointment.id}`}>
                              {appointment.doctorName} · {appointment.clinic} · {formatDateTime(appointment.scheduledAt)}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {labs.length ? (
                        <optgroup label="Lab results">
                          {labs.map((lab) => (
                            <option key={lab.id} value={`LAB_RESULT:${lab.id}`}>
                              {lab.testName} · {lab.flag} · {formatDateTime(lab.dateTaken)}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {doctors.length ? (
                        <optgroup label="Doctors">
                          {doctors.map((doctor) => (
                            <option key={doctor.id} value={`DOCTOR:${doctor.id}`}>
                              {doctor.name} · {[doctor.specialty, doctor.clinic].filter(Boolean).join(" · ") || "Directory entry"}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      name="notes"
                      className="min-h-[120px]"
                      placeholder="Add context for what this file contains and why it matters."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>File</Label>
                    <Input name="file" type="file" required />
                  </div>

                  <Button type="submit" size="lg">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload document
                  </Button>
                </form>
              </ModuleFormCard>
            </StaggerItem>

            <StaggerItem>
              <ModuleListCard
                title="Document library"
                description={`${visibleDocuments.length} of ${documents.length} documents shown with linked context and review signals.`}
              >
                <div className="space-y-4">
                  {visibleDocuments.length ? (
                    visibleDocuments.map((document) => {
                      const linked = linkMap.get(document.id) ?? null;
                      const hasNotes = Boolean(document.notes?.trim());
                      const hasLink = Boolean(document.linkedRecordType && document.linkedRecordId);

                      return (
                        <DataCard
                          key={document.id}
                          id={`item-${document.id}`}
                          className={getFocusedCardClass(focus, document.id)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold">{document.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Uploaded: {formatDateTime(document.createdAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-background/70">{DOCUMENT_TYPE_LABELS[document.type]}</Badge>
                              <StatusPill tone={hasLink ? "success" : "warning"}>{hasLink ? "Linked" : "Needs link"}</StatusPill>
                              <StatusPill tone={hasNotes ? "success" : "neutral"}>{hasNotes ? "Notes added" : "No notes"}</StatusPill>
                            </div>
                          </div>

                          {linked ? (
                            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Link2 className="h-4 w-4 text-primary" />
                                Linked record
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                <Badge className="bg-background/80">{linked.label}</Badge>
                                <a href={linked.href} className="text-sm font-medium text-primary">
                                  Open linked record
                                </a>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">{linked.meta}</p>
                            </div>
                          ) : (
                            <div className="mt-4 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
                              <p className="font-medium text-amber-800 dark:text-amber-200">Suggested next step</p>
                              <p className="mt-1 text-amber-700 dark:text-amber-300">
                                Link this file to an appointment, lab result, or doctor so it appears with better clinical context.
                              </p>
                            </div>
                          )}

                          <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <p className="text-sm font-medium">Notes</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {document.notes ?? "No notes added. Add context so this document is easier to review later."}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            {document.fileName ? (
                              <Badge className="bg-background/70">{document.fileName}</Badge>
                            ) : null}
                            <Badge className="bg-background/70">{Math.max(1, Math.round(document.sizeBytes / 1024))} KB</Badge>

                            {document.filePath ? (
                              <a
                                href={`/api/documents/${document.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-primary"
                              >
                                Open secure file
                              </a>
                            ) : null}
                          </div>

                          <details className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground">
                              <PencilLine className="h-4 w-4 text-primary" />
                              Manage document
                            </summary>

                            <div className="mt-4 grid gap-4">
                              <form action={updateDocumentMetadata} className="grid gap-4">
                                <input type="hidden" name="id" value={document.id} />

                                <div className="space-y-2">
                                  <Label>Title</Label>
                                  <Input name="title" required defaultValue={document.title} />
                                </div>

                                <div className="space-y-2">
                                  <Label>Type</Label>
                                  <Select name="type" defaultValue={document.type}>
                                    {documentTypeOptions.map((type) => (
                                      <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Link to existing record</Label>
                                  <Select
                                    name="linkedRecordKey"
                                    defaultValue={serializeDocumentLinkKey(document.linkedRecordType, document.linkedRecordId)}
                                  >
                                    <option value="">No linked record</option>
                                    {appointments.length ? (
                                      <optgroup label="Appointments">
                                        {appointments.map((appointment) => (
                                          <option key={appointment.id} value={`APPOINTMENT:${appointment.id}`}>
                                            {appointment.doctorName} · {appointment.clinic} · {formatDateTime(appointment.scheduledAt)}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ) : null}
                                    {labs.length ? (
                                      <optgroup label="Lab results">
                                        {labs.map((lab) => (
                                          <option key={lab.id} value={`LAB_RESULT:${lab.id}`}>
                                            {lab.testName} · {lab.flag} · {formatDateTime(lab.dateTaken)}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ) : null}
                                    {doctors.length ? (
                                      <optgroup label="Doctors">
                                        {doctors.map((doctor) => (
                                          <option key={doctor.id} value={`DOCTOR:${doctor.id}`}>
                                            {doctor.name} · {[doctor.specialty, doctor.clinic].filter(Boolean).join(" · ") || "Directory entry"}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ) : null}
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Notes</Label>
                                  <Textarea name="notes" className="min-h-[110px]" defaultValue={document.notes ?? ""} />
                                </div>

                                <Button type="submit" variant="outline">
                                  Save changes
                                </Button>
                              </form>

                              <form action={deleteDocument}>
                                <input type="hidden" name="id" value={document.id} />
                                <Button type="submit" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                  Delete document
                                </Button>
                              </form>
                            </div>
                          </details>
                        </DataCard>
                      );
                    })
                  ) : documents.length ? (
                    <EmptyState title="No documents match these filters" description="Reset filters or search for another title, type, file name, or note." />
                  ) : (
                    <EmptyState title="No documents yet" description="Upload a medical file to begin building your document library." />
                  )}
                </div>
              </ModuleListCard>
            </StaggerItem>
          </div>
        </StaggerGroup>
      </div>
    </AppShell>
  );
}
