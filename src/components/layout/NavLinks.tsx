"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ResolvedMenuItem } from "../../lib/menu";

// Client component only for the active-link highlight + mobile toggle —
// everything else in the header stays server-rendered. `items` comes from
// the admin-editable menu (src/lib/menu.ts), not a hardcoded list.
export function NavLinks({ items }: { items: ResolvedMenuItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle navigation"
        aria-expanded={open}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
      >
        <span className="block h-0.5 w-5 bg-ink" />
        <span className="block h-0.5 w-5 bg-ink" />
        <span className="block h-0.5 w-5 bg-ink" />
      </button>
      <nav
        className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-16 flex-col gap-3.5 border-b border-border bg-surface p-5 md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0`}
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`font-semibold text-ink no-underline hover:text-brand ${pathname === item.href ? "text-brand" : ""}`}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/admin"
          className="rounded-md border border-border px-3.5 py-1.5 font-semibold text-ink no-underline hover:border-brand hover:text-brand"
          onClick={() => setOpen(false)}
        >
          Admin
        </Link>
      </nav>
    </>
  );
}
