"use client";

import { useState, useTransition } from "react";
import type { MenuItem, Page } from "@prisma/client";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteMenuItem, reorderMenuItems } from "../../../../src/lib/actions/menu";

type MenuItemWithPage = MenuItem & { page: Page | null };

export function MenuItemList({ initialItems }: { initialItems: MenuItemWithPage[] }) {
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const oldIndex = current.findIndex((i) => i.id === active.id);
      const newIndex = current.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(current, oldIndex, newIndex);
      startTransition(() => {
        reorderMenuItems(reordered.map((i) => i.id));
      });
      return reordered;
    });
  }

  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">No menu items yet — add one below.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <SortableMenuItem key={item.id} item={item} onDeleted={() => setItems((c) => c.filter((i) => i.id !== item.id))} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableMenuItem({ item, onDeleted }: { item: MenuItemWithPage; onDeleted: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const target = item.page ? (item.page.isHome ? "/" : `/${item.page.slug}`) : item.url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 ${isDragging ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab touch-none px-1 text-ink-muted active:cursor-grabbing"
      >
        ⠿
      </button>
      <span className="font-semibold text-ink">{item.label}</span>
      <span className="flex-1 truncate text-sm text-ink-muted">{target}</span>
      <form
        action={async () => {
          await deleteMenuItem(item.id);
          onDeleted();
        }}
      >
        <button type="submit" className="text-sm font-semibold text-error">
          Delete
        </button>
      </form>
    </div>
  );
}
