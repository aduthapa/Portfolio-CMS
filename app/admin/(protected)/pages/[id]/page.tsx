import { notFound } from "next/navigation";
import Link from "next/link";
import { getPageById } from "../../../../../src/lib/pages";
import { getAllBlocksForPage } from "../../../../../src/lib/blocks";
import { updatePageTitle } from "../../../../../src/lib/actions/pages";
import { AddBlockButtons } from "./AddBlockButtons";
import { BlockList } from "../../../../../src/components/admin/BlockList";

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
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/pages" className="text-sm font-semibold text-ink-muted no-underline hover:text-ink">
            ← All pages
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-ink">{page.title}</h1>
        </div>
        <Link href={publicUrl} target="_blank" className="text-sm font-semibold text-ink-muted no-underline hover:text-ink">
          View page ({publicUrl}) →
        </Link>
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          await updatePageTitle(pageId, formData);
        }}
        className="mt-6 flex items-end gap-3 rounded-lg border border-border bg-surface p-5"
      >
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          Page title
          <input
            type="text"
            name="title"
            defaultValue={page.title}
            required
            className="w-64 rounded-md border border-border bg-surface px-3 py-2 text-ink"
          />
        </label>
        <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink">
          Save title
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-bold text-ink">Add a block</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Click to add it to the bottom of your page, then edit its content and drag it into place.
        </p>
        <div className="mt-3">
          <AddBlockButtons pageId={pageId} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-ink">
          Your page ({blocks.length} block{blocks.length === 1 ? "" : "s"})
        </h2>
        <BlockList pageId={pageId} initialBlocks={blocks} />
      </div>
    </div>
  );
}
