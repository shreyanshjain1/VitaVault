import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireUser(): Promise<{
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };
}