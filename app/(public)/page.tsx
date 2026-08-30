import { getSiteSettings } from "../../src/lib/settings";
import { getVisiblePageBlocks } from "../../src/lib/blocks";
import { getCurrentUser } from "../../src/lib/session";
import { BlockRenderer } from "../../src/components/blocks/BlockRenderer";
import { ButtonLink } from "../../src/components/ui/Button";

export default async function HomePage() {
  const [settings, blocks, currentUser] = await Promise.all([
    getSiteSettings(),
    getVisiblePageBlocks(),
    getCurrentUser(),
  ]);

  return (
    <>
      <section
        className="px-5 py-[72px] text-white"
        style={{ background: "linear-gradient(160deg, var(--brand-dark), var(--brand) 70%)" }}
      >
        <div className="mx-auto max-w-[700px]">
          <h1 className="text-[2.4rem] font-bold">{settings.tagline || "Welcome to my portfolio."}</h1>
          <div className="mt-5 flex gap-3">
            <ButtonLink href="/contact" variant="primary" size="lg">
              Get in touch
            </ButtonLink>
          </div>
        </div>
      </section>

      {blocks.length === 0 ? (
        <div className="mx-auto max-w-[1120px] px-5 py-[60px] text-center">
          <p className="text-ink-muted">This page hasn&apos;t been built yet.</p>
          {currentUser && (
            <ButtonLink href="/admin/builder" variant="primary" className="mt-4">
              Open the page builder →
            </ButtonLink>
          )}
        </div>
      ) : (
        blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
      )}
    </>
  );
}
