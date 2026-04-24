"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  forgotPasswordAction,
  resetPasswordAction,
  type AccountActionState,
} from "@/app/account-actions";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";

const initialState: AccountActionState = { error: null, success: null };

function InlineAlert({ tone, message }: { tone: "danger" | "success"; message: string }) {
  const cls =
    tone === "success"
      ? "border-emerald-200/70 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
      : "border-rose-200/70 bg-rose-50/70 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200";

  return <div className={`rounded-3xl border p-3 text-sm ${cls}`}>{message}</div>;
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialState);

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription className="mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            {state?.error ? <InlineAlert tone="danger" message={state.error} /> : null}
            {state?.success ? <InlineAlert tone="success" message={state.success} /> : null}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">Email</p>
              <Input name="email" type="email" placeholder="you@email.com" required />
            </div>

            <Button type="submit" className="w-full">
              Send reset link
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remembered your password? <Link href="/login" className="font-medium text-primary">Back to login</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initialState);

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription className="mt-1">
            Choose a new password for your VitaVault account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            {state?.error ? <InlineAlert tone="danger" message={state.error} /> : null}
            {state?.success ? <InlineAlert tone="success" message={state.success} /> : null}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">New password</p>
              <Input name="password" type="password" placeholder="••••••••" required />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">Confirm new password</p>
              <Input name="confirmPassword" type="password" placeholder="••••••••" required />
            </div>

            <Button type="submit" className="w-full">
              Update password
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Back to <Link href="/login" className="font-medium text-primary">login</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
