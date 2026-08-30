"use client";

import { useActionState } from "react";
import { signupAction, type LoginState } from "../../../src/lib/actions/auth";

const initialState: LoginState = {};
const inputClass = "rounded-md border border-border bg-surface px-3 py-2 text-ink";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-md border border-error bg-error/10 px-3 py-2 text-sm text-error">{state.error}</p>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Name
        <input type="text" name="name" required autoFocus autoComplete="name" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Email
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Password
        <input type="password" name="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Confirm password
        <input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
