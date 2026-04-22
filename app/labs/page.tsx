import { LabFlag } from "@prisma/client";
import { FlaskConical, PencilLine, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { deleteLabResult, saveLabResult, updateLabResult } from "@/app/actions";
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
import { formatDate } from "@/lib/utils";
import { ModuleFormCard, ModuleHero, ModuleListCard, DataCard } from "@/components/module-sections";
import { PageTransition, StaggerGroup, StaggerItem } from "@/components/page-transition";
import { getFocusedCardClass } from "@/lib/record-focus";

export default async function LabsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; flag?: string; focus?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q ?? "";
  const flag = params.flag ?? "";
  const focus = params.focus ?? "";

  const results = await db.labResult.findMany({
    where: {
      userId: user.id,
      ...(q
        ? {
            OR: [
              { testName: { contains: q, mode: "insensitive" } },
              { resultSummary: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(flag ? { flag: flag as LabFlag } : {}),
    },
    orderBy: { dateTaken: "desc" },
  });

  const abnormalCount = results.filter((r) => r.flag !== "NORMAL").length;
  const latestResult = results[0] ?? null;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageTransition>
          <PageHeader
            title="Lab Results"
            description="Store structured lab entries so trends, flags, and exports stay easy to review."
            action={
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-background/70">{results.length} results</Badge>
                <Badge className="bg-background/70">{abnormalCount} flagged</Badge>
              </div>
            }
          />
        </PageTransition>

        <PageTransition delay={0.04}>
          <ModuleHero
            eyebrow="Clinical results"
            title="Results and abnormal flags"
            description="This page should make recent testing easy to find, review, and discuss with a clinician or caregiver."
            stats={[
              { label: "Stored results", value: results.length },
              { label: "Flagged results", value: abnormalCount },
              {
                label: "Latest test",
                value: latestResult ? latestResult.testName : "—",
                hint: latestResult ? formatDate(latestResult.dateTaken) : "No result yet",
              },
              {
                label: "Current filter",
                value: flag || "All flags",
              },
            ]}
          />
        </PageTransition>

        <StaggerGroup delay={0.08}>
          <div className="grid gap-6 xl:grid-cols-[1.02fr_1.48fr]">
            <StaggerItem>
              <div className="space-y-6">
                <ModuleFormCard
                  title="Add lab result"
                  description="Create a structured lab entry and attach a source file when available."
                >
                  <form action={saveLabResult} className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Lab test name</Label>
                        <Input name="testName" required placeholder="Complete Blood Count" />
                      </div>

                      <div className="space-y-2">
                        <Label>Date taken</Label>
                        <Input name="dateTaken" type="date" required />
                      </div>

                      <div className="space-y-2">
                        <Label>Flag</Label>
                        <Select name="flag" defaultValue="NORMAL">
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High</option>
                          <option value="LOW">Low</option>
                          <option value="CRITICAL">Critical</option>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Result summary</Label>
                      <Textarea
                        name="resultSummary"
                        className="min-h-[110px]"
                        placeholder="Summarize the key result values and interpretation."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Reference range</Label>
                      <Input name="referenceRange" placeholder="e.g. 4.0 - 10.0 x10^9/L" />
                    </div>

                    <div className="space-y-2">
                      <Label>Source file (optional)</Label>
                      <Input name="file" type="file" />
                    </div>

                    <Button type="submit" size="lg">
                      Add lab result
                    </Button>
                  </form>
                </ModuleFormCard>

                <ModuleFormCard
                  title="Search and filter"
                  description="Quickly narrow down large sets of results."
                >
                  <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <Input name="q" defaultValue={q} placeholder="Test name or summary" />
                    </div>

                    <div className="space-y-2">
                      <Label>Flag</Label>
                      <Select name="flag" defaultValue={flag}>
                        <option value="">All</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="LOW">Low</option>
                        <option value="CRITICAL">Critical</option>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        <Search className="mr-2 h-4 w-4" />
                        Apply
                      </Button>
                    </div>
                  </form>
                </ModuleFormCard>
              </div>
            </StaggerItem>

            <StaggerItem>
              <ModuleListCard
                title="Result history"
                description="Review structured lab entries, flags, and file attachments."
              >
                <div className="space-y-4">
                  {results.length ? (
                    results.map((result) => (
                      <DataCard
                        key={result.id}
                        id={`item-${result.id}`}
                        className={getFocusedCardClass(focus, result.id)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold">{result.testName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Date taken: {formatDate(result.dateTaken)}
                            </p>
                          </div>
                          <Badge className="bg-background/70">{result.flag}</Badge>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <div className="flex items-center gap-2">
                              <FlaskConical className="h-4 w-4 text-primary" />
                              <p className="text-sm font-medium">Result summary</p>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {result.resultSummary}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                            <p className="text-sm font-medium">Reference range</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {result.referenceRange ?? "No reference range added."}
                            </p>

                            {result.filePath ? (
                              <div className="mt-4">
                                <a
                                  href={result.filePath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-primary"
                                >
                                  Open attached file
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <details className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
                          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-foreground">
                            <PencilLine className="h-4 w-4 text-primary" />
                            Manage lab result
                          </summary>

                          <div className="mt-4 grid gap-4">
                            <form action={updateLabResult} className="grid gap-4">
                              <input type="hidden" name="labResultId" value={result.id} />

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Lab test name</Label>
                                  <Input name="testName" required defaultValue={result.testName} />
                                </div>

                                <div className="space-y-2">
                                  <Label>Date taken</Label>
                                  <Input name="dateTaken" type="date" required defaultValue={formatDate(result.dateTaken, "yyyy-MM-dd")} />
                                </div>

                                <div className="space-y-2">
                                  <Label>Flag</Label>
                                  <Select name="flag" defaultValue={result.flag}>
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="LOW">Low</option>
                                    <option value="CRITICAL">Critical</option>
                                  </Select>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Result summary</Label>
                                <Textarea name="resultSummary" className="min-h-[110px]" required defaultValue={result.resultSummary} />
                              </div>

                              <div className="space-y-2">
                                <Label>Reference range</Label>
                                <Input name="referenceRange" defaultValue={result.referenceRange ?? ""} />
                              </div>

                              <Button type="submit" variant="outline">
                                Save changes
                              </Button>
                            </form>

                            <form action={deleteLabResult}>
                              <input type="hidden" name="labResultId" value={result.id} />
                              <Button type="submit" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                                Delete lab result
                              </Button>
                            </form>
                          </div>
                        </details>
                      </DataCard>
                    ))
                  ) : (
                    <EmptyState
                      title="No lab results yet"
                      description="Add a test result to build your lab history."
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
