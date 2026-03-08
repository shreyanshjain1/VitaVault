"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "next-auth/react";
import { HeartPulse } from "lucide-react";
import { signupAction } from "@/app/actions";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button className="w-full">{pending ? "Please wait..." : label}</Button>;
}
function Logo() {
  return <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><HeartPulse className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Health Companion</p><p className="text-xs text-muted-foreground">Personal Health Record</p></div></div>;
}
export function SignupForm() {
  const [state, action] = useActionState(signupAction as any, null);
  return <Card className="w-full max-w-md"><CardHeader className="space-y-4"><Logo /><div><CardTitle>Create your account</CardTitle><CardDescription>Start organizing your health records securely.</CardDescription></div></CardHeader><CardContent><form action={action} className="space-y-4"><Input name="name" placeholder="Full name" required /><Input type="email" name="email" placeholder="Email address" required /><Input type="password" name="password" placeholder="Password" required />{state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}<SubmitButton label="Create account" /></form><p className="mt-4 text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-primary">Sign in</Link></p></CardContent></Card>;
}
export function LoginForm() {
  async function onSubmit(formData: FormData) {
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
  }
  return <Card className="w-full max-w-md"><CardHeader className="space-y-4"><Logo /><div><CardTitle>Welcome back</CardTitle><CardDescription>Use the demo account or log in with your own credentials.</CardDescription></div></CardHeader><CardContent><form action={onSubmit} className="space-y-4"><Input type="email" name="email" placeholder="Email address" required /><Input type="password" name="password" placeholder="Password" required /><SubmitButton label="Sign in" /></form><div className="mt-4 rounded-2xl bg-muted p-4 text-sm"><p className="font-medium">Demo account</p><p>Email: demo@health.local</p><p>Password: demo12345</p></div><p className="mt-4 text-sm text-muted-foreground">Need an account? <Link href="/signup" className="text-primary">Create one</Link></p></CardContent></Card>;
}
