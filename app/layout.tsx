import type { Metadata } from "next";
import { getSiteSettings } from "../src/lib/settings";
import "./globals.css";

// Every page here is per-request/session-driven (auth, DB-backed
// settings/content) — there are no static pages to prerender, same as the
// old Express app where nothing was build-time generated. Declaring this
// explicitly stops Next from attempting to execute DB-backed metadata/page
// code during `next build`'s static page-data collection, which otherwise
// requires a reachable DATABASE_URL at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.siteName || "Portfolio CMS",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-alt text-ink antialiased">
        {/* Runtime-editable brand color, admin-set via Settings — ported
            from views/partials/public-header.ejs's inline <style> override
            so no rebuild is needed when SiteSetting.primaryColor changes. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--brand:${settings.primaryColor || "#7c3aed"}}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
