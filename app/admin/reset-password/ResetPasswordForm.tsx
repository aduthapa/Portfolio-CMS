"use client";

import { useActionState } from "react";
import { resetPasswordAction, type LoginState } from "../../../src/lib/actions/auth";

const initialState: LoginState = {};
const inputClass = "rounded-md border border-border bg-surface px-3 py-2 text-ink";

export function ResetPasswordForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md border border-error bg-error/10 px-3 py-2 text-sm text-error">{state.error}</p>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Email
        <input type="email" name="email" required defaultValue={defaultEmail} autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        6-digit code
        <input
          type="text"
          name="code"
          required
          autoFocus
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        New password
        <input type="password" name="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Confirm new password
        <input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}
