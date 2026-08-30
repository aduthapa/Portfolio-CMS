import Link from "next/link";
import type { SiteSetting } from "@prisma/client";

export function SiteFooter({ settings }: { settings: SiteSetting }) {
  const socialLinks = [
    { url: settings.instagramUrl, label: "Instagram" },
    { url: settings.twitterUrl, label: "Twitter" },
    { url: settings.youtubeUrl, label: "YouTube" },
  ].filter((link) => link.url);

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-start justify-between gap-4 px-5 py-8">
        <div>
          <strong className="text-ink">{settings.siteName}</strong>
          {settings.tagline && <p className="mt-1 text-ink-muted">{settings.tagline}</p>}
        </div>
        <div className="flex gap-4">
          {socialLinks.map((link) => (
            <a key={link.label} href={link.url!} target="_blank" rel="noopener" className="font-semibold text-ink-muted no-underline hover:text-ink">
              {link.label}
            </a>
          ))}
          <Link href="/contact" className="font-semibold text-ink-muted no-underline hover:text-ink">
            Contact
          </Link>
        </div>
        <p className="w-full text-sm text-ink-muted">
          &copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
