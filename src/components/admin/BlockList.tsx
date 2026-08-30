"use client";

import { useState, useTransition } from "react";
import type { PageBlock } from "@prisma/client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteBlock, reorderBlocks, toggleBlockVisibility, updateBlock } from "../../lib/actions/pages";
import { BlockEditForm } from "./BlockEditForm";

const TYPE_LABELS: Record<string, string> = {
  HEADING: "Heading",
  TEXT: "Text",
  IMAGE: "Image",
  GALLERY: "Gallery",
  BUTTON: "Button",
  VIDEO: "Video",
  DIVIDER: "Divider",
};

export function BlockList({ pageId, initialBlocks }: { pageId: number; initialBlocks: PageBlock[] }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((current) => {
      const oldIndex = current.findIndex((b) => b.id === active.id);
      const newIndex = current.findIndex((b) => b.id === over.id);
      const reordered = arrayMove(current, oldIndex, newIndex);
      startTransition(() => {
        reorderBlocks(pageId, reordered.map((b) => b.id));
      });
      return reordered;
    });
  }

  if (blocks.length === 0) {
    return <p className="text-sm text-ink-muted">No blocks yet — add one above to start building your page.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              expanded={expandedId === block.id}
              onToggleExpand={() => setExpandedId(expandedId === block.id ? null : block.id)}
              onDeleted={() => setBlocks((current) => current.filter((b) => b.id !== block.id))}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableBlockItem({
  block,
  expanded,
  onToggleExpand,
  onDeleted,
}: {
  block: PageBlock;
  expanded: boolean;
  onToggleExpand: () => void;
  onDeleted: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-border bg-surface ${isDragging ? "opacity-60" : ""} ${block.visible ? "" : "opacity-50"}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none px-1 text-ink-muted active:cursor-grabbing"
        >
          ⠿
        </button>
        <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold text-ink-muted">
          {TYPE_LABELS[block.type] || block.type}
        </span>
        <span className="flex-1 truncate text-sm text-ink-muted">{blockPreview(block)}</span>
        <button type="button" onClick={onToggleExpand} className="text-sm font-semibold text-brand">
          {expanded ? "Close" : "Edit"}
        </button>
        <form action={toggleBlockVisibility.bind(null, block.id)}>
          <button type="submit" className="text-sm font-semibold text-ink-muted" title={block.visible ? "Hide" : "Show"}>
            {block.visible ? "Hide" : "Show"}
          </button>
        </form>
        <form
          action={async () => {
            await deleteBlock(block.id);
            onDeleted();
          }}
        >
          <button type="submit" className="text-sm font-semibold text-error">
            Delete
          </button>
        </form>
      </div>
      {expanded && (
        <form action={updateBlock.bind(null, block.id)} className="border-t border-border px-4 py-4">
          <BlockEditForm block={block} />
          <button type="submit" className="mt-3 rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white">
            Save block
          </button>
        </form>
      )}
    </div>
  );
}

function blockPreview(block: PageBlock): string {
  const content = block.content as Record<string, unknown>;
  if (typeof content.text === "string") return content.text;
  if (typeof content.label === "string") return content.label;
  if (typeof content.url === "string") return content.url;
  return "";
}
