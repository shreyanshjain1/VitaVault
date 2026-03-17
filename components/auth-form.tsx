"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type AuthActionState } from "@/app/actions";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";

const initialState: AuthActionState = { error: null, success: null };

function Logo() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <span className="text-xl font-bold">V</span>
      </div>
      <p className="mt-3 text-lg font-semibold tracking-tight">VitaVault</p>
      <p className="text-sm text-muted-foreground">Personal Health Record Companion</p>
    </div>
  );
}

function InlineAlert({ tone, message }: { tone: "danger" | "success"; message: string }) {
  const cls =
    tone === "success"
      ? "border-emerald-200/70 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
      : "border-rose-200/70 bg-rose-50/70 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200";

  return (
    <div className={`rounded-3xl border p-3 text-sm ${cls}`}>
      {message}
    </div>
  );
}

export function SignupForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState(signupAction, initialState);

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <Logo />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription className="mt-1">
            Start organizing your health records securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

            {state?.error ? <InlineAlert tone="danger" message={state.error} /> : null}
            {state?.success ? <InlineAlert tone="success" message={state.success} /> : null}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">Name</p>
              <Input name="name" placeholder="Juan Dela Cruz" required />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">Email</p>
              <Input name="email" type="email" placeholder="you@email.com" required />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">Password</p>
              <Input name="password" type="password" placeholder="••••••••" required />
            </div>

            <Button type="submit" className="w-full">
              Create account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
                className="font-medium text-primary"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <Logo />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription className="mt-1">
            Sign in to access your health dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

            {state?.error ? <InlineAlert tone="danger" message={state.error} /> : null}
            {state?.success ? <InlineAlert tone="success" message={state.success} /> : null}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">Email</p>
              <Input name="email" type="email" placeholder="you@email.com" required />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">Password</p>
              <Input name="password" type="password" placeholder="••••••••" required />
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href={callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signup"}
                className="font-medium text-primary"
              >
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}