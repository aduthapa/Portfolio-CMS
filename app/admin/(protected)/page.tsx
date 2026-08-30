import { getCurrentUser } from "../../../src/lib/session";

// Placeholder dashboard. The real one (stats, recent inquiries, etc. —
// see src/routes/admin/dashboard.routes.ts) is ported in a later phase
// alongside the rest of the admin panel.
export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Welcome, {user?.name}</h1>
      <p className="mt-2 text-ink-muted">
        Use <strong>Pages</strong> in the sidebar to create and edit pages, and <strong>Menu</strong> to manage site
        navigation.
      </p>
    </div>
  );
}
