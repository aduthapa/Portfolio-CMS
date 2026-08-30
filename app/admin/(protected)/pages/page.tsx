import Link from "next/link";
import { getPages } from "../../../../src/lib/pages";
import { deletePage } from "../../../../src/lib/actions/pages";
import { NewPageForm } from "./NewPageForm";

export default async function PagesListPage() {
  const pages = await getPages();

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Pages</h1>
      <p className="mt-1 text-ink-muted">
        Every page on your site, built from drag-and-drop blocks. The Home page can&apos;t be deleted — it&apos;s
        always what visitors see at &ldquo;/&rdquo;.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <NewPageForm />
      </div>

      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
        {pages.map((page) => (
          <div key={page.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <Link href={`/admin/pages/${page.id}`} className="font-semibold text-ink no-underline hover:text-brand">
                {page.title}
              </Link>
              {page.isHome && (
                <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">Home</span>
              )}
              <p className="text-sm text-ink-muted">
                {page.isHome ? "/" : `/${page.slug}`} · {page._count.blocks} block
                {page._count.blocks === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={page.isHome ? "/" : `/${page.slug}`}
                target="_blank"
                className="text-sm font-semibold text-ink-muted no-underline hover:text-ink"
              >
                View →
              </Link>
              <Link
                href={`/admin/pages/${page.id}`}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-ink no-underline"
              >
                Edit
              </Link>
              {!page.isHome && (
                <form action={deletePage.bind(null, page.id)}>
                  <button type="submit" className="rounded-md bg-error/10 px-3 py-1.5 text-sm font-semibold text-error">
                    Delete
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
