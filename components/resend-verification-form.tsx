"use client";

import { useActionState } from "react";

import { resendVerificationEmailAction, type AccountActionState } from "@/app/account-actions";
import { Button } from "@/components/ui";

const initialState: AccountActionState = { error: null, success: null };

export function ResendVerificationForm() {
  const [state, action, pending] = useActionState(resendVerificationEmailAction, initialState);

  return (
    <form action={action} className="space-y-3">
      {state?.error ? (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          {state.error}
        </div>
      ) : null}
      {state?.success ? (
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {state.success}
        </div>
      ) : null}
      <Button type="submit" variant="outline" className="w-full" disabled={pending}>
        {pending ? "Sending..." : "Resend verification email"}
      </Button>
    </form>
  );
}
