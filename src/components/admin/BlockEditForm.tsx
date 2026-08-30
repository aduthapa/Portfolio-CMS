import type { PageBlock } from "@prisma/client";
import type {
  ButtonContent,
  GalleryContent,
  HeadingContent,
  ImageContent,
  TextContent,
  VideoContent,
} from "../../lib/blocks";

// Per-type fields, matching the content shapes buildBlockContent() in
// src/lib/actions/pages.ts writes — same fields the old
// admin/builder.routes.ts's buildContent() accepted.
export function BlockEditForm({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "HEADING": {
      const c = block.content as unknown as HeadingContent;
      return (
        <div className="flex flex-col gap-3">
          <Field label="Text">
            <input name="text" defaultValue={c.text} maxLength={200} className={inputClass} />
          </Field>
          <Field label="Level">
            <select name="level" defaultValue={c.level || "h2"} className={inputClass}>
              <option value="h1">Heading 1 (large)</option>
              <option value="h2">Heading 2 (medium)</option>
              <option value="h3">Heading 3 (small)</option>
            </select>
          </Field>
        </div>
      );
    }
    case "TEXT": {
      const c = block.content as unknown as TextContent;
      return (
        <Field label="Text">
          <textarea name="text" defaultValue={c.text} maxLength={5000} rows={4} className={inputClass} />
        </Field>
      );
    }
    case "IMAGE": {
      const c = block.content as unknown as ImageContent;
      return (
        <div className="flex flex-col gap-3">
          <Field label="Image URL">
            <input name="url" defaultValue={c.url} maxLength={500} className={inputClass} />
          </Field>
          <Field label="Caption (optional)">
            <input name="caption" defaultValue={c.caption} maxLength={200} className={inputClass} />
          </Field>
        </div>
      );
    }
    case "GALLERY": {
      const c = block.content as unknown as GalleryContent;
      return (
        <Field label="Image URLs (one per line)">
          <textarea
            name="urls"
            defaultValue={c.images?.map((i) => i.url).join("\n")}
            rows={4}
            className={inputClass}
          />
        </Field>
      );
    }
    case "BUTTON": {
      const c = block.content as unknown as ButtonContent;
      return (
        <div className="flex flex-col gap-3">
          <Field label="Label">
            <input name="label" defaultValue={c.label} maxLength={60} className={inputClass} />
          </Field>
          <Field label="Link URL">
            <input name="url" defaultValue={c.url} maxLength={500} className={inputClass} />
          </Field>
          <Field label="Style">
            <select name="style" defaultValue={c.style || "primary"} className={inputClass}>
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </Field>
        </div>
      );
    }
    case "VIDEO": {
      const c = block.content as unknown as VideoContent;
      return (
        <Field label="YouTube / Vimeo URL">
          <input name="url" defaultValue={c.url} maxLength={500} className={inputClass} />
        </Field>
      );
    }
    case "DIVIDER":
    default:
      return <p className="text-sm text-ink-muted">A horizontal divider — nothing to configure.</p>;
  }
}

const inputClass = "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-ink">
      {label}
      {children}
    </label>
  );
}
