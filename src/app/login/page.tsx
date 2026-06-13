"use client";

import { useActionState } from "react";
import { login, signup, type AuthState } from "./actions";

const initial: AuthState = {};

export default function LoginPage() {
  const [loginState, loginAction, loggingIn] = useActionState(login, initial);
  const [signupState, signupAction, signingUp] = useActionState(signup, initial);

  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-leaf-bright)]">
          Bonzaipon
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Grow your day, one task at a time.
        </p>
      </div>

      <form className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--color-muted)]">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-leaf)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-muted)]">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-leaf)]"
          />
        </div>

        {(loginState.error || signupState.error) && (
          <p className="text-sm text-[var(--color-vice)]">
            {loginState.error || signupState.error}
          </p>
        )}
        {signupState.message && (
          <p className="text-sm text-[var(--color-leaf-bright)]">
            {signupState.message}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            formAction={loginAction}
            disabled={loggingIn || signingUp}
            className="flex-1 rounded-xl bg-[var(--color-leaf)] px-4 py-3 font-semibold text-[var(--color-bg)] disabled:opacity-50"
          >
            {loggingIn ? "…" : "Sign in"}
          </button>
          <button
            formAction={signupAction}
            disabled={loggingIn || signingUp}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 font-semibold disabled:opacity-50"
          >
            {signingUp ? "…" : "Create account"}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
        We only ever store your email and an encrypted password.
      </p>
    </main>
  );
}
