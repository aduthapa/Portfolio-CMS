import { redirect } from "next/navigation";
import { getCurrentUser } from "../../src/lib/session";
import { logoutAction } from "../../src/lib/actions/auth";

// Placeholder proving the auth round-trip end to end. The real dashboard
// (stats, recent inquiries, etc. — see src/routes/admin/dashboard.routes.ts)
// is ported in Phase 3 alongside the rest of the admin panel.
export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-ink">Welcome, {user.name}</h1>
      <p className="mt-2 text-ink-muted">
        Signed in as {user.email} ({user.role}). This confirms the Next.js auth scaffold (iron-session + Prisma)
        works end to end against the existing users table.
      </p>
      <form action={logoutAction} className="mt-6">
        <button type="submit" className="rounded-md border border-border bg-surface px-4 py-2 font-semibold text-ink">
          Sign out
        </button>
      </form>
    </main>
  );
}
