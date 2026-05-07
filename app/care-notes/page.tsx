import Link from "next/link";
import { MessageSquarePlus, Pin, ShieldCheck, UsersRound } from "lucide-react";
import { CareNoteCategory, CareNotePriority, CareNoteVisibility } from "@prisma/client";

import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, StatusPill } from "@/components/common";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/session";
import {
  careNoteCategoryLabels,
  careNotePriorityLabels,
  careNotePriorityTone,
  careNoteVisibilityDescription,
  careNoteVisibilityLabels,
  getCareNoteWorkspaceData,
} from "@/lib/care-notes";
import { archiveCareNoteAction, createCareNoteAction, toggleCareNotePinAction } from "./actions";

function formatNoteDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function visibilityTone(value: CareNoteVisibility) {
  if (value === "PRIVATE") return "neutral" as const;
  if (value === "PROVIDERS") return "info" as const;
  return "success" as const;
}

function StatCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function CareNotesPage() {
  const user = await requireUser();
  const data = await getCareNoteWorkspaceData(user.id);
  const writablePatients = data.patientOptions.filter((item) => item.canAddNotes);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeader
          title="Care Notes"
          description="Structured collaboration notes for care-team handoffs, shared patient context, provider follow-up, and family updates."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/care-team" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/60">
                Care Team
              </Link>
              <Link href="/timeline?type=CARE_NOTE" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/60">
                Timeline notes
              </Link>
              <Link href="/report-builder?preset=care-team-weekly" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/60">
                Care report
              </Link>
              <Link href="/notifications" className="inline-flex h-10 items-center justify-center rounded-2xl border border-border/70 bg-background/60 px-4 text-sm font-medium hover:bg-muted/60">
                Notifications
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Visible notes" value={data.metrics.total} description="Active notes across your record and shared patients." />
          <StatCard title="Pinned" value={data.metrics.pinned} description="Pinned handoff notes shown first in care views." />
          <StatCard title="High priority" value={data.metrics.urgent} description="Urgent or high-priority notes for follow-up." />
          <StatCard title="Written by me" value={data.metrics.authoredByMe} description="Notes you contributed to the care workspace." />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary"><MessageSquarePlus className="h-5 w-5" /></div>
                <div>
                  <CardTitle>Add care note</CardTitle>
                  <CardDescription className="mt-1">Create a note for your own record or a shared patient where you have note permissions.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {writablePatients.length === 0 ? (
                <EmptyState title="No writable care records" description="You can add notes to your own record or to shared patient records where the owner granted note permissions." />
              ) : (
                <form action={createCareNoteAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Patient record</Label>
                    <Select name="ownerUserId" required>
                      {writablePatients.map((patient) => (
                        <option key={patient.ownerUserId} value={patient.ownerUserId}>{patient.label}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input name="title" placeholder="Example: Follow up on dizziness after new medication" required />
                  </div>

                  <div className="space-y-2">
                    <Label>Note</Label>
                    <Textarea name="body" className="min-h-[150px]" placeholder="Add care context, what changed, who should follow up, and any next step." required />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select name="category" defaultValue={CareNoteCategory.GENERAL}>
                        {Object.values(CareNoteCategory).map((category) => (
                          <option key={category} value={category}>{careNoteCategoryLabels[category]}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select name="priority" defaultValue={CareNotePriority.NORMAL}>
                        {Object.values(CareNotePriority).map((priority) => (
                          <option key={priority} value={priority}>{careNotePriorityLabels[priority]}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <Select name="visibility" defaultValue={CareNoteVisibility.CARE_TEAM}>
                        {Object.values(CareNoteVisibility).map((visibility) => (
                          <option key={visibility} value={visibility}>{careNoteVisibilityLabels[visibility]}</option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/60 p-3 text-sm">
                    <input type="checkbox" name="pinned" />
                    Pin this note for handoff visibility
                  </label>

                  <Button type="submit" className="w-full">Create care note</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category coverage</CardTitle>
                <CardDescription>Where the care team is adding context.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {data.categoryBreakdown.map((item) => (
                  <div key={item.category} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.label}</p>
                      <Badge>{item.count}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Collaboration guardrails</CardTitle>
                    <CardDescription>Notes are permission-aware and audit logged.</CardDescription>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                <p className="rounded-2xl border border-border/60 bg-background/60 p-4">Only owners and members with note permission can create notes.</p>
                <p className="rounded-2xl border border-border/60 bg-background/60 p-4">Pinned and high-priority notes are surfaced in shared patient workspaces.</p>
                <p className="rounded-2xl border border-border/60 bg-background/60 p-4">Create, pin, unpin, and archive actions are written into the access audit trail.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Care note timeline</CardTitle>
                <CardDescription>Recent notes across your record and shared care records.</CardDescription>
              </div>
              <UsersRound className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.notes.length === 0 ? (
              <EmptyState title="No care notes yet" description="Create the first handoff note to start building shared care context." />
            ) : (
              data.notes.map((note) => (
                <div key={note.id} className="rounded-3xl border border-border/60 bg-background/60 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {note.pinned ? <StatusPill tone="warning"><Pin className="mr-1 h-3 w-3" />Pinned</StatusPill> : null}
                        <StatusPill tone={careNotePriorityTone(note.priority)}>{careNotePriorityLabels[note.priority]}</StatusPill>
                        <StatusPill tone={visibilityTone(note.visibility)}>{careNoteVisibilityLabels[note.visibility]}</StatusPill>
                        <Badge>{careNoteCategoryLabels[note.category]}</Badge>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{note.title}</h2>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{note.body}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Patient: {note.owner.healthProfile?.fullName || note.owner.name || note.owner.email} • Author: {note.author.name || note.author.email} • {formatNoteDate(note.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">{careNoteVisibilityDescription(note.visibility)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <form action={toggleCareNotePinAction}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <Button type="submit" size="sm" variant="outline">{note.pinned ? "Unpin" : "Pin"}</Button>
                      </form>
                      <form action={archiveCareNoteAction}>
                        <input type="hidden" name="noteId" value={note.id} />
                        <Button type="submit" size="sm" variant="secondary">Archive</Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
