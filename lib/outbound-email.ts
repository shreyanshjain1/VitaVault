import { AlertSeverity, AlertStatus, ReminderState } from "@prisma/client";

const RESEND_API_URL = "https://api.resend.com/emails";

export function outboundEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!outboundEmailEnabled()) {
    throw new Error("Email delivery is not configured.");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email delivery failed: ${body || response.statusText}`);
  }

  return response.json().catch(() => null);
}

function reminderStateLabel(state: ReminderState) {
  switch (state) {
    case ReminderState.DUE:
      return "Due";
    case ReminderState.SENT:
      return "Sent";
    case ReminderState.OVERDUE:
      return "Overdue";
    case ReminderState.SKIPPED:
      return "Skipped";
    case ReminderState.COMPLETED:
      return "Completed";
    case ReminderState.MISSED:
      return "Missed";
    default:
      return state;
  }
}

function severityLabel(severity: AlertSeverity) {
  return severity.charAt(0) + severity.slice(1).toLowerCase();
}

export async function sendReminderEmail(args: {
  to: string;
  patientName: string;
  reminder: {
    id: string;
    title: string;
    description: string | null;
    dueAt: Date;
    state: ReminderState;
    timezone: string | null;
    gracePeriodMinutes: number | null;
  };
}) {
  const dueText = new Date(args.reminder.dueAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: args.reminder.timezone || undefined,
  });

  const stateText = reminderStateLabel(args.reminder.state);
  const subject = `VitaVault reminder: ${args.reminder.title}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin-bottom:8px">Reminder for ${escapeHtml(args.patientName)}</h2>
      <p style="margin:0 0 16px">This reminder was sent from VitaVault.</p>
      <div style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;background:#f9fafb">
        <p style="margin:0 0 8px"><strong>Title:</strong> ${escapeHtml(args.reminder.title)}</p>
        <p style="margin:0 0 8px"><strong>Due:</strong> ${escapeHtml(dueText)}</p>
        <p style="margin:0 0 8px"><strong>Status:</strong> ${escapeHtml(stateText)}</p>
        <p style="margin:0 0 8px"><strong>Grace period:</strong> ${args.reminder.gracePeriodMinutes ?? 60} minutes</p>
        <p style="margin:0"><strong>Details:</strong> ${escapeHtml(args.reminder.description || "No additional description.")}</p>
      </div>
    </div>
  `;
  const text = [
    `Reminder for ${args.patientName}`,
    `Title: ${args.reminder.title}`,
    `Due: ${dueText}`,
    `Status: ${stateText}`,
    `Grace period: ${args.reminder.gracePeriodMinutes ?? 60} minutes`,
    `Details: ${args.reminder.description || "No additional description."}`,
  ].join("\n");

  return sendEmail({ to: args.to, subject, html, text });
}

export async function sendAlertDigestEmail(args: {
  to: string;
  patientName: string;
  alerts: Array<{
    id: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    status: AlertStatus;
    createdAt: Date;
  }>;
}) {
  const openAlerts = args.alerts.filter((alert) => alert.status === AlertStatus.OPEN);
  const criticalAlerts = args.alerts.filter((alert) => alert.severity === AlertSeverity.CRITICAL);
  const subject = `VitaVault alert digest: ${openAlerts.length} open alert${openAlerts.length === 1 ? "" : "s"}`;
  const rows = args.alerts
    .map((alert) => {
      const created = new Date(alert.createdAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      return `
        <tr>
          <td style="padding:10px;border-top:1px solid #e5e7eb">${escapeHtml(alert.title)}</td>
          <td style="padding:10px;border-top:1px solid #e5e7eb">${escapeHtml(severityLabel(alert.severity))}</td>
          <td style="padding:10px;border-top:1px solid #e5e7eb">${escapeHtml(alert.status)}</td>
          <td style="padding:10px;border-top:1px solid #e5e7eb">${escapeHtml(created)}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin-bottom:8px">Alert digest for ${escapeHtml(args.patientName)}</h2>
      <p style="margin:0 0 16px">Open alerts: <strong>${openAlerts.length}</strong> · Critical alerts: <strong>${criticalAlerts.length}</strong></p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#fff">
        <thead style="background:#f9fafb;text-align:left">
          <tr>
            <th style="padding:10px">Alert</th>
            <th style="padding:10px">Severity</th>
            <th style="padding:10px">Status</th>
            <th style="padding:10px">Created</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="4" style="padding:12px">No alerts to include.</td></tr>`}</tbody>
      </table>
    </div>
  `;
  const text = [
    `Alert digest for ${args.patientName}`,
    `Open alerts: ${openAlerts.length}`,
    `Critical alerts: ${criticalAlerts.length}`,
    "",
    ...args.alerts.map((alert) => `${alert.title} | ${severityLabel(alert.severity)} | ${alert.status} | ${new Date(alert.createdAt).toLocaleString()}`),
  ].join("\n");

  return sendEmail({ to: args.to, subject, html, text });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
