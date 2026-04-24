import Link from "next/link";

import { ResetPasswordForm } from "@/components/account-recovery-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const token = typeof params.token === "string" ? params.token : "";

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-md p-6">
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Reset link required</CardTitle>
            <CardDescription className="mt-1">
              This page needs a valid reset link from your email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/forgot-password">
              <Button className="w-full">Request a new reset link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
