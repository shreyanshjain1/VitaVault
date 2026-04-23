import { type DocumentLinkType } from "@prisma/client";
import { db } from "@/lib/db";

export type ParsedDocumentLink = {
  linkedRecordType: DocumentLinkType | null;
  linkedRecordId: string | null;
};

export type DocumentLinkSummary = {
  label: string;
  href: string;
  meta: string;
};

export function parseDocumentLinkKey(raw: FormDataEntryValue | string | null | undefined): ParsedDocumentLink {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    return { linkedRecordType: null, linkedRecordId: null };
  }

  const [type, ...rest] = value.split(":");
  const id = rest.join(":").trim();

  if (!id || !type) {
    throw new Error("Invalid linked record selection.");
  }

  if (type !== "APPOINTMENT" && type !== "LAB_RESULT" && type !== "DOCTOR") {
    throw new Error("Unsupported linked record type.");
  }

  return {
    linkedRecordType: type as DocumentLinkType,
    linkedRecordId: id,
  };
}

export function serializeDocumentLinkKey(
  linkedRecordType?: DocumentLinkType | null,
  linkedRecordId?: string | null
) {
  if (!linkedRecordType || !linkedRecordId) return "";
  return `${linkedRecordType}:${linkedRecordId}`;
}

export async function validateDocumentLinkOwnership(
  userId: string,
  raw: FormDataEntryValue | string | null | undefined
): Promise<ParsedDocumentLink> {
  const parsed = parseDocumentLinkKey(raw);

  if (!parsed.linkedRecordType || !parsed.linkedRecordId) {
    return parsed;
  }

  let exists = false;

  if (parsed.linkedRecordType === "APPOINTMENT") {
    exists = Boolean(
      await db.appointment.findFirst({
        where: { id: parsed.linkedRecordId, userId },
        select: { id: true },
      })
    );
  }

  if (parsed.linkedRecordType === "LAB_RESULT") {
    exists = Boolean(
      await db.labResult.findFirst({
        where: { id: parsed.linkedRecordId, userId },
        select: { id: true },
      })
    );
  }

  if (parsed.linkedRecordType === "DOCTOR") {
    exists = Boolean(
      await db.doctor.findFirst({
        where: { id: parsed.linkedRecordId, userId },
        select: { id: true },
      })
    );
  }

  if (!exists) {
    throw new Error("The selected linked record was not found.");
  }

  return parsed;
}

export async function getDocumentLinkSummary(
  userId: string,
  linkedRecordType?: DocumentLinkType | null,
  linkedRecordId?: string | null
): Promise<DocumentLinkSummary | null> {
  if (!linkedRecordType || !linkedRecordId) return null;

  if (linkedRecordType === "APPOINTMENT") {
    const appointment = await db.appointment.findFirst({
      where: { id: linkedRecordId, userId },
      select: {
        id: true,
        doctorName: true,
        clinic: true,
        scheduledAt: true,
        status: true,
      },
    });

    if (!appointment) return null;

    return {
      label: `Appointment · ${appointment.doctorName}`,
      href: `/appointments?focus=${appointment.id}`,
      meta: `${appointment.clinic} · ${appointment.status} · ${new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(appointment.scheduledAt)}`,
    };
  }

  if (linkedRecordType === "LAB_RESULT") {
    const lab = await db.labResult.findFirst({
      where: { id: linkedRecordId, userId },
      select: {
        id: true,
        testName: true,
        flag: true,
        dateTaken: true,
      },
    });

    if (!lab) return null;

    return {
      label: `Lab result · ${lab.testName}`,
      href: `/labs?focus=${lab.id}`,
      meta: `${lab.flag} · ${new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
      }).format(lab.dateTaken)}`,
    };
  }

  const doctor = await db.doctor.findFirst({
    where: { id: linkedRecordId, userId },
    select: {
      id: true,
      name: true,
      specialty: true,
      clinic: true,
    },
  });

  if (!doctor) return null;

  return {
    label: `Doctor · ${doctor.name}`,
    href: `/doctors?focus=${doctor.id}`,
    meta: [doctor.specialty, doctor.clinic].filter(Boolean).join(" · ") || "Directory entry",
  };
}
