import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug } from "../../../src/lib/pages";
import { getVisibleBlocksForPage } from "../../../src/lib/blocks";
import { getSiteSettings } from "../../../src/lib/settings";
import { BlockRenderer } from "../../../src/components/blocks/BlockRenderer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};
  const settings = await getSiteSettings();
  return { title: `${page.title} — ${settings.siteName}` };
}

// Renders any admin-created Page at its top-level slug (e.g. /about,
// /services) — the Home page is excluded here since it's served at "/"
// by app/(public)/page.tsx instead. Explicit routes (like /contact,
// /admin) always take precedence over this catch-all in Next's router,
// so there's no collision risk from a page slug matching a reserved path.
export default async function CustomPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page || page.isHome) notFound();

  const blocks = await getVisibleBlocksForPage(page.id);

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-10">
      <h1 className="mb-6 text-3xl font-bold text-ink">{page.title}</h1>
      {blocks.length === 0 ? (
        <p className="text-ink-muted">This page hasn&apos;t been built yet.</p>
      ) : (
        blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
      )}
    </div>
  );
}
