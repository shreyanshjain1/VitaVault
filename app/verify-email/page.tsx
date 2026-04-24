import Link from "next/link";

import { auth } from "@/lib/auth";
import { consumeEmailVerificationToken } from "@/lib/account-email";
import { ResendVerificationForm } from "@/components/resend-verification-form";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const token = typeof params.token === "string" ? params.token : "";

  const session = await auth();
  const result = token
    ? await consumeEmailVerificationToken(token)
    : { ok: false as const, message: "Verification link is missing." };

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>{result.ok ? "Email verified" : "Verification failed"}</CardTitle>
          <CardDescription className="mt-1">{result.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/login">
            <Button className="w-full">Go to login</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full">Open dashboard</Button>
          </Link>
          {!token && session?.user?.id ? <ResendVerificationForm /> : null}
        </CardContent>
      </Card>
    </div>
  );
}
