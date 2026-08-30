import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../../../src/lib/session";
import { getSiteSettings } from "../../../src/lib/settings";
import { AuthCard } from "../../../src/components/auth/AuthCard";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  if (user) redirect("/admin");

  return (
    <AuthCard
      title="Create account"
      subtitle={`An administrator must approve your account before you can sign in to ${settings.siteName}.`}
      footer={
        <Link href="/admin/login" className="font-semibold text-brand no-underline">
          Already have an account? Sign in
        </Link>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
