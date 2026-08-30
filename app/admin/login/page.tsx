import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../src/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-bold text-ink">Sign in</h1>
      <LoginForm />
    </main>
  );
}
