"use server";

import { revalidatePath } from "next/cache";
import { DeviceConnectionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function formString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function getOwnedConnection(connectionId: string, userId: string) {
  if (!connectionId) throw new Error("Device connection id is required.");
  const connection = await db.deviceConnection.findFirst({
    where: { id: connectionId, userId },
    select: { id: true, userId: true, source: true, platform: true, clientDeviceId: true, deviceLabel: true, status: true },
  });
  if (!connection) throw new Error("Device connection not found.");
  return connection;
}

async function writeDeviceAuditLog(params: { ownerUserId: string; actorUserId: string; action: string; connectionId: string; metadata?: Record<string, unknown> }) {
  await db.accessAuditLog.create({
    data: {
      ownerUserId: params.ownerUserId,
      actorUserId: params.actorUserId,
      action: params.action,
      targetType: "DEVICE_CONNECTION",
      targetId: params.connectionId,
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}

function revalidateDevicePages(connectionId: string) {
  revalidatePath("/device-connection");
  revalidatePath(`/device-connection/${connectionId}`);
  revalidatePath("/device-sync-simulator");
  revalidatePath("/security");
  revalidatePath("/audit-log");
}

export async function disconnectDeviceConnectionAction(formData: FormData) {
  const user = await requireUser();
  const connection = await getOwnedConnection(formString(formData, "connectionId"), user.id!);
  if (connection.status === DeviceConnectionStatus.REVOKED) throw new Error("Revoked connections cannot be disconnected again.");
  await db.deviceConnection.update({ where: { id: connection.id }, data: { status: DeviceConnectionStatus.DISCONNECTED, lastError: null } });
  await writeDeviceAuditLog({ ownerUserId: user.id!, actorUserId: user.id!, action: "DEVICE_CONNECTION_DISCONNECTED", connectionId: connection.id, metadata: { source: connection.source, clientDeviceId: connection.clientDeviceId } });
  revalidateDevicePages(connection.id);
}

export async function reconnectDeviceConnectionAction(formData: FormData) {
  const user = await requireUser();
  const connection = await getOwnedConnection(formString(formData, "connectionId"), user.id!);
  if (connection.status === DeviceConnectionStatus.REVOKED) throw new Error("Revoked connections cannot be reconnected. Create a new mobile/device link instead.");
  await db.deviceConnection.update({ where: { id: connection.id }, data: { status: DeviceConnectionStatus.ACTIVE, lastError: null } });
  await writeDeviceAuditLog({ ownerUserId: user.id!, actorUserId: user.id!, action: "DEVICE_CONNECTION_RECONNECTED", connectionId: connection.id, metadata: { source: connection.source, clientDeviceId: connection.clientDeviceId } });
  revalidateDevicePages(connection.id);
}

export async function revokeDeviceConnectionAction(formData: FormData) {
  const user = await requireUser();
  const connection = await getOwnedConnection(formString(formData, "connectionId"), user.id!);
  if (formString(formData, "confirmation").toUpperCase() !== "REVOKE") throw new Error("Type REVOKE to confirm device connection revocation.");
  await db.deviceConnection.update({ where: { id: connection.id }, data: { status: DeviceConnectionStatus.REVOKED, lastError: null } });
  await writeDeviceAuditLog({ ownerUserId: user.id!, actorUserId: user.id!, action: "DEVICE_CONNECTION_REVOKED", connectionId: connection.id, metadata: { source: connection.source, clientDeviceId: connection.clientDeviceId } });
  revalidateDevicePages(connection.id);
}

export async function clearDeviceConnectionErrorAction(formData: FormData) {
  const user = await requireUser();
  const connection = await getOwnedConnection(formString(formData, "connectionId"), user.id!);
  await db.deviceConnection.update({ where: { id: connection.id }, data: { lastError: null } });
  await writeDeviceAuditLog({ ownerUserId: user.id!, actorUserId: user.id!, action: "DEVICE_CONNECTION_ERROR_CLEARED", connectionId: connection.id, metadata: { source: connection.source, previousStatus: connection.status } });
  revalidateDevicePages(connection.id);
}
