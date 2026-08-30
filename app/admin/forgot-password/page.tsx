import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../../../src/lib/session";
import { AuthCard } from "../../../src/components/auth/AuthCard";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const [user, { email }] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect("/admin");

  return (
    <AuthCard
      title="Forgot password"
      subtitle="Enter your email and we'll send you a 6-digit code to reset your password."
      footer={
        <Link href="/admin/login" className="font-semibold text-brand no-underline">
          ← Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm defaultEmail={email || ""} />
    </AuthCard>
  );
}
