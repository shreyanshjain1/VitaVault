import { LoginForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  return <LoginForm callbackUrl={callbackUrl} />;
}