"use client";

import { LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PublicUser } from "@/modules/identity/domain/user";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  NETWORK_ENGINEER: "Network Engineer",
  VIEWER: "Viewer",
} as const;

export function UserMenu({ user }: { readonly user: PublicUser }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    setSignOutError(false);
    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });

      if (!response.ok) {
        setSignOutError(true);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setSignOutError(true);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span aria-live="polite" className="sr-only">
        {signOutError ? "Sign out failed. Try again." : ""}
      </span>
      <div className="hidden text-right xl:block">
        <p className="max-w-40 truncate text-xs font-semibold">{user.name}</p>
        <p className="text-muted text-[0.68rem]">{ROLE_LABELS[user.role]}</p>
      </div>
      <div
        aria-hidden="true"
        className="bg-panel text-muted hidden size-9 place-items-center rounded-full border sm:grid"
      >
        <UserRound className="size-4" />
      </div>
      <button
        aria-label="Sign out"
        className="bg-panel text-muted hover:text-foreground grid min-h-10 min-w-10 place-items-center rounded-lg border disabled:opacity-60"
        disabled={isSigningOut}
        onClick={() => void signOut()}
        title={signOutError ? "Sign out failed. Try again." : "Sign out"}
        type="button"
      >
        <LogOut aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
