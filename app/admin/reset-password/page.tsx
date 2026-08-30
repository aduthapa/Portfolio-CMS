import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../../../src/lib/session";
import { AuthCard } from "../../../src/components/auth/AuthCard";
import { ResetPasswordForm } from "./ResetPasswordForm";

interface Props {
  searchParams: Promise<{ email?: string; notice?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const [user, { email, notice }] = await Promise.all([getCurrentUser(), searchParams]);
  if (user) redirect("/admin");

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter the code we emailed you along with your new password."
      notice={notice}
      footer={
        <Link href="/admin/forgot-password" className="font-semibold text-brand no-underline">
          Didn&apos;t get a code? Request a new one
        </Link>
      }
    >
      <ResetPasswordForm defaultEmail={email || ""} />
    </AuthCard>
  );
}
