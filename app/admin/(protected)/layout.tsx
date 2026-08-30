import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../../../src/lib/session";
import { logoutAction } from "../../../src/lib/actions/auth";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/menu", label: "Menu" },
];

// Shared admin shell (sidebar + top bar) for every /admin/** route except
// /admin/login, which renders standalone. More sections (Profiles,
// Inquiries, Media, Settings, Team) join navItems as they're ported —
// only linking to routes that actually exist keeps this from filling up
// with dead links mid-migration.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col bg-[#16151d] px-4 py-6 text-white">
        <span className="mb-8 px-2 text-lg font-bold">Portfolio CMS</span>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 font-medium text-white/80 no-underline hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6">
          <Link href="/" className="text-sm text-white/60 no-underline hover:text-white">
            ← View public site
          </Link>
        </div>
      </aside>
      <div className="flex-1 bg-surface-alt">
        <header className="flex items-center justify-end gap-3 border-b border-border bg-surface px-6 py-3">
          <span className="text-sm text-ink-muted">
            {user.name} <span className="uppercase">{user.role}</span>
          </span>
          <form action={logoutAction}>
            <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-ink">
              Sign out
            </button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
