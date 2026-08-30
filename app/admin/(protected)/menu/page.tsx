import { getAllMenuItemsRaw } from "../../../../src/lib/menu";
import { getPages } from "../../../../src/lib/pages";
import { MenuItemList } from "./MenuItemList";
import { NewMenuItemForm } from "./NewMenuItemForm";

export default async function MenuPage() {
  const [items, pages] = await Promise.all([getAllMenuItemsRaw(), getPages()]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Menu</h1>
      <p className="mt-1 text-ink-muted">
        Controls the navigation shown in your site&apos;s header. Drag to reorder.
      </p>

      <div className="mt-6">
        <MenuItemList initialItems={items} />
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-3 text-lg font-bold text-ink">Add menu item</h2>
        <NewMenuItemForm pages={pages} />
      </div>
    </div>
  );
}
