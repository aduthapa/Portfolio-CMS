"use client";

import { useActionState } from "react";
import { createPage, type FormState } from "../../../../src/lib/actions/pages";

const initialState: FormState = {};

export function NewPageForm() {
  const [state, formAction, pending] = useActionState(createPage, initialState);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        New page title
        <input
          type="text"
          name="title"
          required
          placeholder="e.g. About"
          className="w-64 rounded-md border border-border bg-surface px-3 py-2 text-ink"
        />
      </label>
      <button type="submit" disabled={pending} className="rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60">
        {pending ? "Creating…" : "+ New Page"}
      </button>
      {state.error && <p className="text-sm text-error">{state.error}</p>}
    </form>
  );
}
