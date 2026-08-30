"use client";

import type { BlockType } from "@prisma/client";
import { useDraggable } from "@dnd-kit/core";

export const PALETTE_TYPES: { type: BlockType; label: string }[] = [
  { type: "HEADING", label: "Heading" },
  { type: "TEXT", label: "Text" },
  { type: "IMAGE", label: "Image" },
  { type: "GALLERY", label: "Gallery" },
  { type: "CAROUSEL", label: "Carousel" },
  { type: "ICON", label: "Icon" },
  { type: "BUTTON", label: "Button" },
  { type: "VIDEO", label: "Video" },
  { type: "DIVIDER", label: "Divider" },
];

function PaletteItem({ type, label, onClick }: { type: BlockType; label: string; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${type}` });

  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={onClick}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab flex-col items-center gap-1 rounded-md border border-border bg-surface px-2 py-3 text-xs font-semibold text-ink active:cursor-grabbing ${isDragging ? "opacity-40" : "hover:border-brand hover:text-brand"}`}
    >
      {label}
    </button>
  );
}

// Widget palette — drag an item onto the canvas to insert it there, or
// just click to append it to the bottom of the page.
export function PageBuilderPalette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">Widgets</h2>
        <p className="mt-1 text-xs text-ink-muted">Drag onto the page, or click to add to the bottom.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_TYPES.map(({ type, label }) => (
          <PaletteItem key={type} type={type} label={label} onClick={() => onAdd(type)} />
        ))}
      </div>
    </div>
  );
}
