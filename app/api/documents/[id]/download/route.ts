import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveStoredDocumentPath } from "@/lib/document-storage";

export const runtime = "nodejs";

function contentDisposition(fileName: string, mimeType: string) {
  const safeName = path.basename(fileName).replace(/[\r\n"]/g, "-");
  const encoded = encodeURIComponent(safeName);
  const disposition = mimeType === "application/pdf" || mimeType.startsWith("image/") ? "inline" : "attachment";
  return `${disposition}; filename="${safeName}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  const document = await db.medicalDocument.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      title: true,
      fileName: true,
      filePath: true,
      mimeType: true,
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const resolved = resolveStoredDocumentPath(document.filePath);

  if (!resolved) {
    return NextResponse.json({ error: "Document storage path is invalid." }, { status: 400 });
  }

  try {
    const bytes = await readFile(resolved.absolutePath);
    const response = new NextResponse(bytes);
    response.headers.set("Content-Type", document.mimeType || "application/octet-stream");
    response.headers.set(
      "Content-Disposition",
      contentDisposition(document.fileName || `${document.title}.bin`, document.mimeType || "application/octet-stream")
    );
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch {
    return NextResponse.json({ error: "Document file is unavailable." }, { status: 404 });
  }
}
