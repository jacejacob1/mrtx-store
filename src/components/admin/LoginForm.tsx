"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

export const adminField =
  "t-body mt-2 h-12 w-full rounded-xl border border-line bg-surface px-4 text-fg outline-none transition-colors placeholder:text-fg-2 focus:border-fg";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-10 space-y-4">
      <label className="t-small block text-fg-2">
        Email
        <input name="email" type="email" autoComplete="username" required className={adminField} />
      </label>
      <label className="t-small block text-fg-2">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={adminField} />
      </label>
      <p role="alert" aria-live="polite" className="t-small min-h-[1.5em] text-accent">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="t-body flex h-12 w-full items-center justify-center rounded-full bg-fg font-semibold text-bg transition-opacity disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
