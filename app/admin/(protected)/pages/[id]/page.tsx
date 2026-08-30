import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageById } from "../../../../../src/lib/pages";
import { getAllBlocksForPage } from "../../../../../src/lib/blocks";
import { updatePageTitle } from "../../../../../src/lib/actions/pages";
import { PageBuilder } from "../../../../../src/components/admin/PageBuilder";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PageBuilderPage({ params }: Props) {
  const { id } = await params;
  const pageId = Number(id);
  const page = await getPageById(pageId);
  if (!page) notFound();

  const blocks = await getAllBlocksForPage(pageId);
  const publicUrl = page.isHome ? "/" : `/${page.slug}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/pages" className="text-sm font-semibold text-ink-muted no-underline hover:text-ink">
            ← All pages
          </Link>
          <form
            action={async (formData: FormData) => {
              "use server";
              await updatePageTitle(pageId, formData);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              name="title"
              defaultValue={page.title}
              required
              className="rounded-md border border-border bg-surface px-2 py-1 text-lg font-bold text-ink"
            />
            <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm font-semibold text-ink">
              Save
            </button>
          </form>
        </div>
        <Link href={publicUrl} target="_blank" className="text-sm font-semibold text-ink-muted no-underline hover:text-ink">
          View page ({publicUrl}) →
        </Link>
      </div>

      <PageBuilder pageId={pageId} initialBlocks={blocks} />
    </div>
  );
}
