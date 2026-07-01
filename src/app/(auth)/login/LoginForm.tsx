"use client";

import { useActionState } from "react";

import { signInWithEmailPassword, type LoginActionState } from "./actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInWithEmailPassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-[var(--radius-input)] border border-border-subtle bg-surface-panel px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      {state.error ? (
        <p className="rounded-lg bg-red-950/40 border border-red-900/30 px-3 py-2 text-sm text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[var(--radius-input)] bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
