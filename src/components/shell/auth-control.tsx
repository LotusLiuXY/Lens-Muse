"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { LogIn, LogOut, UserRound } from "lucide-react";

// Prominent, spec-sheet-styled sign-in / account control for the app header.
export function AuthControl() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const loading = useEazo((s) => s.auth.loading);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (loading) {
    return (
      <div
        data-el="auth-control-loading"
        className="flex h-8 items-center border border-border bg-card px-3"
      >
        <span className="size-3.5 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        data-el="auth-control-signin"
        onClick={() => auth.login().catch(() => undefined)}
        className="flex items-center gap-1.5 border-2 border-foreground bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground lm-hard-shadow-sm transition-transform active:translate-x-0.5 active:translate-y-0.5"
      >
        <LogIn className="h-3.5 w-3.5" aria-hidden />
        {t("common.signIn")}
      </button>
    );
  }

  const displayName = user.name ?? user.email ?? user.id;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-el="auth-control-badge"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border border-foreground bg-card px-2 py-1"
      >
        <Avatar user={user} size={20} />
        <span className="max-w-[92px] truncate text-xs font-medium text-foreground">
          {displayName}
        </span>
      </button>

      {open && (
        <div
          data-el="auth-control-menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 border-2 border-foreground bg-card lm-hard-shadow-sm"
        >
          <div className="flex items-center gap-2.5 border-b-2 border-dashed border-border px-3 py-3">
            <Avatar user={user} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name ?? "—"}
              </p>
              {user.email && (
                <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            data-el="auth-control-signout"
            onClick={() => {
              auth.logout();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("common.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({
  user,
  size,
}: {
  user: { name?: string | null; email?: string | null; avatarUrl?: string | null };
  size: number;
}) {
  if (user.avatarUrl) {
    const src = user.avatarUrl.startsWith("//") ? `https:${user.avatarUrl}` : user.avatarUrl;
    return (
      <Image
        src={src}
        alt={user.name ?? "avatar"}
        width={size}
        height={size}
        className="border border-border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (user.name ?? user.email ?? "?")[0]?.toUpperCase() ?? "?";
  return (
    <span
      className="flex shrink-0 items-center justify-center bg-primary/10 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial === "?" ? <UserRound className="h-3.5 w-3.5" aria-hidden /> : initial}
    </span>
  );
}
