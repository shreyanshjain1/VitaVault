export function isInviteEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendCareInviteEmail(args: {
  to: string;
  inviteLink: string;
  ownerName: string;
  ownerEmail: string;
  accessRole: string;
  expiresAt: Date;
  note?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      attempted: false,
      sent: false,
      reason: "Invite email delivery is not configured.",
    } as const;
  }

  const safeOwnerName = escapeHtml(args.ownerName);
  const safeOwnerEmail = escapeHtml(args.ownerEmail);
  const safeAccessRole = escapeHtml(args.accessRole);
  const safeInviteLink = escapeHtml(args.inviteLink);
  const safeExpiry = escapeHtml(args.expiresAt.toLocaleString());
  const safeNote = args.note ? escapeHtml(args.note) : "";

  const subject = `${args.ownerName} invited you to VitaVault`;
  const text = [
    `You were invited by ${args.ownerName} (${args.ownerEmail}) to join a VitaVault care team.`,
    `Role: ${args.accessRole}`,
    `Expires: ${args.expiresAt.toLocaleString()}`,
    args.note ? `Note: ${args.note}` : null,
    `Accept invite: ${args.inviteLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;font-size:22px;">You were invited to a VitaVault care team</h2>
      <p style="margin:0 0 12px;">${safeOwnerName} (${safeOwnerEmail}) invited you to collaborate in VitaVault.</p>
      <p style="margin:0 0 6px;"><strong>Role:</strong> ${safeAccessRole}</p>
      <p style="margin:0 0 6px;"><strong>Expires:</strong> ${safeExpiry}</p>
      ${safeNote ? `<p style="margin:0 0 12px;"><strong>Note:</strong> ${safeNote}</p>` : ""}
      <p style="margin:18px 0;">
        <a href="${safeInviteLink}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;">Open invite</a>
      </p>
      <p style="margin:0 0 12px;font-size:14px;color:#4b5563;">This invite must be accepted using the exact email address it was sent to.</p>
      <p style="margin:0;font-size:13px;color:#6b7280;word-break:break-all;">${safeInviteLink}</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as { id?: string };

  return {
    attempted: true,
    sent: true,
    provider: "resend",
    messageId: payload.id ?? null,
  } as const;
}
