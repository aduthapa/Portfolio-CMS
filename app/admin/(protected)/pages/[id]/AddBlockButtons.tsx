import type { BlockType } from "@prisma/client";
import { addBlock } from "../../../../../src/lib/actions/pages";

const TYPES: { type: BlockType; label: string }[] = [
  { type: "HEADING", label: "+ Heading" },
  { type: "TEXT", label: "+ Text" },
  { type: "IMAGE", label: "+ Image" },
  { type: "GALLERY", label: "+ Gallery" },
  { type: "BUTTON", label: "+ Button" },
  { type: "VIDEO", label: "+ Video" },
  { type: "DIVIDER", label: "+ Divider" },
];

// Adds a bare block of the chosen type to the bottom of the page; the
// admin then edits its content and drags it into place below — same flow
// as the old admin/builder.ejs's "Add a block" row.
export function AddBlockButtons({ pageId }: { pageId: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TYPES.map(({ type, label }) => (
        <form key={type} action={addBlock.bind(null, pageId, type)}>
          <button
            type="submit"
            className="rounded-md border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            {label}
          </button>
        </form>
      ))}
    </div>
  );
}
