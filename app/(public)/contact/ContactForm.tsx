"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactState } from "../../../src/lib/actions/contact";

const initialState: ContactState = {};
const inputClass = "rounded-md border border-border bg-surface px-3 py-2 text-ink";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);

  if (state.success) {
    return (
      <p className="rounded-md border border-success bg-success/10 px-4 py-3 text-success">
        Thanks! Your message has been sent — we&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      {state.error && (
        <p className="rounded-md border border-error bg-error/10 px-3 py-2 text-sm text-error">{state.error}</p>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Name
        <input type="text" name="name" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Email
        <input type="email" name="email" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Phone
        <input type="tel" name="phone" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Subject
        <input type="text" name="subject" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Message
        <textarea name="message" rows={5} required className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
