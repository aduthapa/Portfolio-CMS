import Link from "next/link";
import type { SiteSetting } from "@prisma/client";
import { NavLinks } from "./NavLinks";
import { getMenuItems } from "../../lib/menu";

export async function SiteHeader({ settings }: { settings: SiteSetting }) {
  const menuItems = await getMenuItems();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface">
      <div className="relative mx-auto flex max-w-[1120px] items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink no-underline">
          {settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- admin-supplied logo URL
            <img src={settings.logoUrl} alt={settings.siteName} className="h-8 w-auto" />
          )}
          <span>{settings.siteName}</span>
        </Link>
        <NavLinks items={menuItems} />
      </div>
    </header>
  );
}
