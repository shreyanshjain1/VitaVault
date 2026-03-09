"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type AuthActionState } from "@/app/actions";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";

const initialState: AuthActionState = {
  error: null,
  success: null,
};

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">
        V
      </div>
      <div>
        <p className="text-lg font-semibold">VitaVault</p>
        <p className="text-xs text-muted-foreground">
          Personal Health Record Companion
        </p>
      </div>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <Button type="submit" className="w-full">
      {label}
    </Button>
  );
}

export function SignupForm() {
  const [state, action] = useActionState<AuthActionState, FormData>(
    signupAction,
    initialState
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4">
        <Logo />
        <div>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Start organizing your health records securely.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-4">
          <Input name="name" placeholder="Full name" required />
          <Input
            type="email"
            name="email"
            placeholder="Email address"
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            required
          />

          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          {state?.success ? (
            <p className="text-sm text-green-600">{state.success}</p>
          ) : null}

          <SubmitButton label="Create account" />
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<AuthActionState, FormData>(
    loginAction,
    initialState
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4">
        <Logo />
        <div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to access your health dashboard.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form action={action} className="space-y-4">
          <Input
            type="email"
            name="email"
            placeholder="Email address"
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            required
          />

          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          {state?.success ? (
            <p className="text-sm text-green-600">{state.success}</p>
          ) : null}

          <SubmitButton label="Sign in" />
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}