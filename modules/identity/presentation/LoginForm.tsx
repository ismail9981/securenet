"use client";

import {
  Check,
  Clipboard,
  LoaderCircle,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { DemoAccount } from "@/modules/identity/infrastructure/demo-accounts";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  NETWORK_ENGINEER: "Network Engineer",
  VIEWER: "Viewer",
} as const;

interface LoginError {
  readonly message: string;
  readonly correlationId?: string;
}

interface LoginFormProps {
  readonly demoAccounts: readonly DemoAccount[];
  readonly demoPassword: string;
}

export function LoginForm({ demoAccounts, demoPassword }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState<string>(demoAccounts[0]?.email ?? "");
  const [password, setPassword] = useState<string>(demoPassword);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [error, setError] = useState<LoginError | null>(null);

  async function selectAccount(index: number) {
    const account = demoAccounts[index];
    if (!account) return;

    setEmail(account.email);
    setPassword(demoPassword);
    setError(null);

    try {
      await navigator.clipboard.writeText(
        `Email: ${account.email}\nPassword: ${demoPassword}`,
      );
      setCopiedRole(account.role);
      window.setTimeout(() => setCopiedRole(null), 1600);
    } catch {
      setCopiedRole(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as {
        error?: { message?: string; correlationId?: string };
      };

      if (!response.ok) {
        setError({
          message: body.error?.message ?? "Sign in could not be completed.",
          ...(body.error?.correlationId
            ? { correlationId: body.error.correlationId }
            : {}),
        });
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError({ message: "Sign in could not be completed. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        aria-describedby={error ? "login-error" : undefined}
        className="bg-panel rounded-xl border p-5 sm:p-6"
        onSubmit={handleSubmit}
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="border-brand/25 bg-brand/10 text-brand grid size-10 shrink-0 place-items-center rounded-lg border">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Sign in to the Demo environment</h2>
            <p className="text-muted mt-1 text-sm leading-6">
              These accounts contain simulated data only and are not production
              identities.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              autoComplete="username"
              className="bg-background mt-2 min-h-11 w-full rounded-lg border px-3 text-sm placeholder:text-[var(--text-subtle)]"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              autoComplete="current-password"
              className="bg-background mt-2 min-h-11 w-full rounded-lg border px-3 text-sm placeholder:text-[var(--text-subtle)]"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
        </div>

        <div
          aria-live="polite"
          className="mt-4 min-h-12 rounded-lg border border-transparent"
          id="login-error"
        >
          {error ? (
            <div className="border-danger/35 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-sm">
              <p>{error.message}</p>
              {error.correlationId ? (
                <p className="mt-1 font-mono text-xs">
                  Reference: {error.correlationId}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          className="bg-brand mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-[var(--accent-primary-hover)] disabled:cursor-not-allowed disabled:opacity-65"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <LogIn aria-hidden="true" className="size-4" />
          )}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <aside
        className="bg-panel rounded-xl border p-5"
        aria-labelledby="demo-accounts"
      >
        <p className="text-info text-xs font-semibold tracking-[0.14em] uppercase">
          Demo-only access
        </p>
        <h2 className="mt-2 font-semibold" id="demo-accounts">
          Deterministic RBAC accounts
        </h2>
        <p className="text-muted mt-2 text-sm leading-6">
          Choose an account to fill and copy its public Demo credentials.
        </p>
        <p className="bg-background text-muted mt-3 rounded-lg border px-3 py-2 text-xs leading-5">
          {demoAccounts.length === 1
            ? "This account uses"
            : "These accounts use"}{" "}
          the public Demo password{" "}
          <code className="text-foreground font-mono">{demoPassword}</code>.
        </p>
        <ul className="mt-4 space-y-3">
          {demoAccounts.map((account, index) => (
            <li
              className="bg-background rounded-lg border p-3"
              key={account.role}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {ROLE_LABELS[account.role]}
                  </p>
                  <p className="text-muted mt-1 truncate text-xs">
                    {account.email}
                  </p>
                </div>
                <button
                  aria-label={`Use and copy ${ROLE_LABELS[account.role]} credentials`}
                  className="text-muted hover:bg-panel-raised hover:text-foreground inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold"
                  onClick={() => void selectAccount(index)}
                  type="button"
                >
                  {copiedRole === account.role ? (
                    <Check
                      aria-hidden="true"
                      className="text-success size-3.5"
                    />
                  ) : (
                    <Clipboard aria-hidden="true" className="size-3.5" />
                  )}
                  {copiedRole === account.role ? "Copied" : "Use"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
