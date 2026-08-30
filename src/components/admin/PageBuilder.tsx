"use client";

import { useState, useTransition } from "react";
import type { BlockType, PageBlock } from "@prisma/client";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { addBlock, addBlockAt, deleteBlock, reorderBlocks, toggleBlockVisibility, updateBlock } from "../../lib/actions/pages";
import { getVideoEmbedUrl } from "../../utils/video";
import type { PageBlockWithEmbed, VideoContent } from "../../lib/blocks";
import { BlockRenderer } from "../blocks/BlockRenderer";
import { BlockEditForm } from "./BlockEditForm";
import { PageBuilderPalette, PALETTE_TYPES } from "./PageBuilderPalette";

function toRenderable(block: PageBlock): PageBlockWithEmbed {
  return {
    id: block.id,
    type: block.type,
    content: block.content,
    sortOrder: block.sortOrder,
    embedUrl: block.type === "VIDEO" ? getVideoEmbedUrl((block.content as unknown as VideoContent).url || "") : null,
  };
}

export function PageBuilder({ pageId, initialBlocks }: { pageId: number; initialBlocks: PageBlock[] }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeDrag, setActiveDrag] = useState<{ kind: "palette"; label: string } | { kind: "block"; block: PageBlock } | null>(
    null
  );
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const { setNodeRef: setCanvasRootRef } = useDroppable({ id: "canvas-root" });

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id;
    if (typeof id === "string" && id.startsWith("palette:")) {
      const type = id.slice(8) as BlockType;
      setActiveDrag({ kind: "palette", label: PALETTE_TYPES.find((t) => t.type === type)?.label || type });
    } else {
      const block = blocks.find((b) => b.id === id);
      if (block) setActiveDrag({ kind: "block", block });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    if (typeof active.id === "string" && active.id.startsWith("palette:")) {
      const type = active.id.slice(8) as BlockType;
      let index = blocks.length;
      if (over.id !== "canvas-root") {
        const overIndex = blocks.findIndex((b) => b.id === over.id);
        if (overIndex !== -1) index = overIndex;
      }
      startTransition(async () => {
        const created = await addBlockAt(pageId, type, index);
        setBlocks((current) => {
          const next = [...current];
          next.splice(index, 0, created);
          return next;
        });
        setSelectedId(created.id);
      });
      return;
    }

    if (active.id === over.id) return;
    setBlocks((current) => {
      const oldIndex = current.findIndex((b) => b.id === active.id);
      const newIndex = current.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return current;
      const reordered = arrayMove(current, oldIndex, newIndex);
      startTransition(() => {
        reorderBlocks(pageId, reordered.map((b) => b.id));
      });
      return reordered;
    });
  }

  async function handlePaletteClick(type: BlockType) {
    const created = await addBlock(pageId, type);
    setBlocks((current) => [...current, created]);
    setSelectedId(created.id);
  }

  async function handleDelete(id: number) {
    await deleteBlock(id);
    setBlocks((current) => current.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function handleToggleVisible(block: PageBlock) {
    await toggleBlockVisibility(block.id);
    setBlocks((current) => current.map((b) => (b.id === block.id ? { ...b, visible: !b.visible } : b)));
  }

  async function handleSaveBlock(formData: FormData) {
    if (!selectedBlock) return;
    const updated = await updateBlock(selectedBlock.id, formData);
    if (!updated) return;
    setBlocks((current) => current.map((b) => (b.id === updated.id ? updated : b)));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-lg border border-border">
        <div className="w-56 shrink-0 overflow-y-auto border-r border-border bg-surface">
          <PageBuilderPalette onAdd={handlePaletteClick} />
        </div>

        <div ref={setCanvasRootRef} className="flex-1 overflow-y-auto bg-surface-alt">
          {blocks.length === 0 ? (
            <div className="flex h-full items-center justify-center p-10 text-center text-ink-muted">
              Drag a widget here from the left, or click one to add it.
            </div>
          ) : (
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="min-h-full bg-surface">
                {blocks.map((block) => (
                  <CanvasBlock
                    key={block.id}
                    block={block}
                    selected={selectedId === block.id}
                    onSelect={() => setSelectedId(block.id)}
                    onDelete={() => handleDelete(block.id)}
                    onToggleVisible={() => handleToggleVisible(block)}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>

        {selectedBlock && (
          <div className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
                {PALETTE_TYPES.find((t) => t.type === selectedBlock.type)?.label || selectedBlock.type}
              </h2>
              <button type="button" onClick={() => setSelectedId(null)} className="text-sm font-semibold text-ink-muted">
                Close
              </button>
            </div>
            <SettingsForm block={selectedBlock} onSaved={handleSaveBlock} />
          </div>
        )}
      </div>

      <DragOverlay>
        {activeDrag?.kind === "palette" && (
          <div className="rounded-md border border-brand bg-surface px-3 py-2 text-sm font-semibold text-brand shadow-lg">
            + {activeDrag.label}
          </div>
        )}
        {activeDrag?.kind === "block" && (
          <div className="rounded-md border border-brand bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-lg">
            Moving block…
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function SettingsForm({ block, onSaved }: { block: PageBlock; onSaved: (formData: FormData) => void }) {
  return (
    <form
      action={async (formData: FormData) => {
        await onSaved(formData);
      }}
      className="flex flex-col gap-3"
    >
      <BlockEditForm block={block} />
      <button type="submit" className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
        Save
      </button>
    </form>
  );
}

function CanvasBlock({
  block,
  selected,
  onSelect,
  onDelete,
  onToggleVisible,
}: {
  block: PageBlock;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative cursor-pointer border-2 ${selected ? "border-brand" : "border-transparent hover:border-brand/40"} ${isDragging ? "opacity-40" : ""} ${block.visible ? "" : "opacity-40"}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-end gap-1 p-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [.border-brand_&]:opacity-100">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
          className="pointer-events-auto cursor-grab rounded bg-ink px-2 py-1 text-xs font-semibold text-white active:cursor-grabbing"
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
          className="pointer-events-auto rounded bg-ink px-2 py-1 text-xs font-semibold text-white"
        >
          {block.visible ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="pointer-events-auto rounded bg-error px-2 py-1 text-xs font-semibold text-white"
        >
          Delete
        </button>
      </div>
      <BlockRenderer block={toRenderable(block)} />
    </div>
  );
}
