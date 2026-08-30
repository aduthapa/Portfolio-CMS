import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../../../src/lib/session";
import { getSiteSettings } from "../../../src/lib/settings";
import { AuthCard } from "../../../src/components/auth/AuthCard";
import { LoginForm } from "./LoginForm";

const NOTICES: Record<string, string> = {
  "signup-pending": "Account created. An administrator needs to approve your account before you can sign in.",
  "password-reset": "Your password has been updated. Please sign in.",
};

interface Props {
  searchParams: Promise<{ notice?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const [user, settings, { notice }] = await Promise.all([getCurrentUser(), getSiteSettings(), searchParams]);
  if (user) redirect("/admin");

  return (
    <AuthCard
      title={settings.siteName}
      subtitle="Sign in to manage your site."
      notice={notice ? NOTICES[notice] : undefined}
      footer={
        <>
          <Link href="/admin/forgot-password" className="font-semibold text-brand no-underline">
            Forgot password?
          </Link>
          <Link href="/admin/signup" className="font-semibold text-brand no-underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
