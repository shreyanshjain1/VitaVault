import { AppRole } from "@prisma/client";
import { auth } from "@/lib/auth";

type AuthenticatedRequestContext =
  | {
      ok: true;
      kind: "session";
      user: {
        id: string;
        role: AppRole;
        email?: string | null;
        name?: string | null;
      };
    }
  | {
      ok: true;
      kind: "token";
    }
  | {
      ok: false;
    };

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const directHeader = request.headers.get("x-internal-api-key") ?? "";

  if (directHeader.trim()) {
    return directHeader.trim();
  }

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}

export async function authenticateInternalRequest(
  request: Request
): Promise<AuthenticatedRequestContext> {
  const session = await auth();

  if (session?.user?.id) {
    return {
      ok: true,
      kind: "session",
      user: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email,
        name: session.user.name,
      },
    };
  }

  const configuredSecret = process.env.INTERNAL_API_SECRET?.trim();
  const providedSecret = getBearerToken(request);

  if (
    configuredSecret &&
    providedSecret &&
    configuredSecret === providedSecret
  ) {
    return {
      ok: true,
      kind: "token",
    };
  }

  return { ok: false };
}

export function canManageAllAlertScans(role: AppRole) {
  return role === AppRole.ADMIN;
}

export function canEvaluateAlertsForUser(params: {
  actorId: string;
  actorRole: AppRole;
  targetUserId: string;
}) {
  return (
    params.actorId === params.targetUserId ||
    params.actorRole === AppRole.ADMIN
  );
}
