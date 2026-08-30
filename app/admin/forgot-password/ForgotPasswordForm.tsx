"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type LoginState } from "../../../src/lib/actions/auth";

const initialState: LoginState = {};

export function ForgotPasswordForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md border border-error bg-error/10 px-3 py-2 text-sm text-error">{state.error}</p>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Email
        <input
          type="email"
          name="email"
          required
          autoFocus
          defaultValue={defaultEmail}
          autoComplete="email"
          className="rounded-md border border-border bg-surface px-3 py-2 text-ink"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset code"}
      </button>
    </form>
  );
}
