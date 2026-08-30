"use client";

import { useActionState, useState } from "react";
import type { Page } from "@prisma/client";
import { createMenuItem, type FormState } from "../../../../src/lib/actions/menu";

const initialState: FormState = {};

export function NewMenuItemForm({ pages }: { pages: Page[] }) {
  const [state, formAction, pending] = useActionState(createMenuItem, initialState);
  const [target, setTarget] = useState("");

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Label
        <input name="label" required maxLength={60} placeholder="e.g. About" className="w-40 rounded-md border border-border bg-surface px-3 py-2 text-ink" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Links to
        <select
          value={target.startsWith("page:") || target === "" ? target : "url:custom"}
          onChange={(e) => setTarget(e.target.value === "url:custom" ? "url:" : e.target.value)}
          className="w-48 rounded-md border border-border bg-surface px-3 py-2 text-ink"
        >
          <option value="" disabled>
            Choose…
          </option>
          {pages.map((page) => (
            <option key={page.id} value={`page:${page.id}`}>
              {page.title}
            </option>
          ))}
          <option value="url:custom">Custom URL…</option>
        </select>
      </label>
      {target.startsWith("url:") && (
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">
          URL
          <input
            value={target.slice(4)}
            onChange={(e) => setTarget(`url:${e.target.value}`)}
            placeholder="/contact or https://…"
            className="w-56 rounded-md border border-border bg-surface px-3 py-2 text-ink"
          />
        </label>
      )}
      <input type="hidden" name="target" value={target} />
      <button type="submit" disabled={pending} className="rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60">
        {pending ? "Adding…" : "+ Add to menu"}
      </button>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
    </form>
  );
}
