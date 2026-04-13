import { FileText, PencilLine, Trash2, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { deleteDocument, updateDocumentMetadata, uploadDocument } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { ModuleFormCard, ModuleHero, ModuleListCard, DataCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";

export default async function DocumentsPage() {
  const user = await requireUser();

  const documents = await db.medicalDocument.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const latest = documents[0] ?? null;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Documents"
            description="Upload reports, scans, and supporting clinical files so your workspace remains complete."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{documents.length} files</Badge>
                <Badge className="bg-background/70">
                  {latest ? `Latest: ${formatDateTime(latest.createdAt)}` : "No uploads yet"}
                </Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Medical files"
            title="Structured clinical document storage"
            description="Keep source files organized so appointments, labs, and care-team review become easier."
            stats={[
              { label: "Stored files", value: documents.length },
              { label: "Latest upload", value: latest ? latest.title : "—" },
              { label: "Latest type", value: latest ? latest.type : "—" },
              { label: "File-linked record", value: latest?.fileName ?? "—" },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.02fr_1.48fr]">
            <StaggerItem>
              <ModuleFormCard
                title="Upload document"
                description="Store a structured title, type, notes, and the source file."
              >
                <form action={uploadDocument} className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input name="title" required placeholder="Chest X-Ray Report" />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select name="type" defaultValue="OTHER">
                      <option value="LAB_RESULT">Lab Result</option>
                      <option value="PRESCRIPTION">Prescription</option>
                      <option value="IMAGING">Imaging</option>
                      <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                      <option value="CONSULT_NOTE">Consult Note</option>
                      <option value="OTHER">Other</option>
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
                description="Review uploaded files and open them when needed."
              >
                <div className="space-y-4">
                  {documents.length ? (
                    documents.map((document) => (
                      <DataCard key={document.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold">{document.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Uploaded: {formatDateTime(document.createdAt)}
                            </p>
                          </div>
                          <Badge className="bg-background/70">{document.type}</Badge>
                        </div>

                        <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">Notes</p>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {document.notes ?? "No notes added."}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {document.fileName ? (
                            <Badge className="bg-background/70">{document.fileName}</Badge>
                          ) : null}

                          {document.filePath ? (
                            <a
                              href={document.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-primary"
                            >
                              Open file
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
                              <input type="hidden" name="documentId" value={document.id} />

                              <div className="space-y-2">
                                <Label>Title</Label>
                                <Input name="title" required defaultValue={document.title} />
                              </div>

                              <div className="space-y-2">
                                <Label>Type</Label>
                                <Select name="type" defaultValue={document.type}>
                                  <option value="LAB_RESULT">Lab Result</option>
                                  <option value="PRESCRIPTION">Prescription</option>
                                  <option value="IMAGING">Imaging</option>
                                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                                  <option value="CONSULT_NOTE">Consult Note</option>
                                  <option value="OTHER">Other</option>
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
                              <input type="hidden" name="documentId" value={document.id} />
                              <Button type="submit" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                                Delete document
                              </Button>
                            </form>
                          </div>
                        </details>
                      </DataCard>
                    ))
                  ) : (
                    <EmptyState
                      title="No documents yet"
                      description="Upload a medical file to begin building your document library."
                    />
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
