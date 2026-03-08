import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader, EmptyState } from "@/components/common";
import { uploadDocument } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function DocumentsPage() {
  const user = await requireUser();
  const docs = await db.medicalDocument.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <AppShell><PageHeader title="Medical Documents" description="Upload prescriptions, result PDFs, certificates, and scans with validated file handling." /><div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]"><Card><CardHeader><CardTitle>Upload document</CardTitle></CardHeader><CardContent><form action={uploadDocument} className="grid gap-4" encType="multipart/form-data"><div className="space-y-2"><Label>Title</Label><Input name="title" required /></div><div className="space-y-2"><Label>Type</Label><Select name="type" defaultValue="OTHER"><option value="PRESCRIPTION">Prescription</option><option value="LAB_RESULT">Lab result</option><option value="DISCHARGE_SUMMARY">Discharge summary</option><option value="CERTIFICATE">Certificate</option><option value="SCAN">Scan / image</option><option value="OTHER">Other</option></Select></div><div className="space-y-2"><Label>File</Label><Input type="file" name="file" accept=".pdf,image/png,image/jpeg,image/webp" required /></div><div className="space-y-2"><Label>Notes</Label><Textarea name="notes" /></div><Button>Upload document</Button></form></CardContent></Card><div className="space-y-4">{docs.length ? docs.map(doc => <Card key={doc.id}><CardContent className="pt-6"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">{doc.title}</h3><p className="text-sm text-muted-foreground">{doc.type.replaceAll("_", " ")}</p></div><Link href={doc.filePath} className="text-sm text-primary">Open</Link></div><div className="mt-3 grid gap-2 text-sm"><p>File name: {doc.fileName}</p><p>Uploaded: {formatDate(doc.createdAt)}</p><p>Size: {(doc.sizeBytes / 1024).toFixed(1)} KB</p><p>Notes: {doc.notes ?? "—"}</p></div></CardContent></Card>) : <EmptyState title="No documents uploaded" description="Upload prescriptions, lab PDFs, and scans to keep your records centralized." />}</div></div></AppShell>;
}
