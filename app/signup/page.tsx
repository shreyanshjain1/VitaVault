import { SignupForm } from "@/components/auth-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  return <SignupForm callbackUrl={callbackUrl} />;
}