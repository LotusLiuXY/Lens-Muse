"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { auth } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { Camera, PenLine, ArrowRight, UserRound } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { listPlans, type PlanListItem } from "@/lib/api";

export default function HomePage() {
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const authLoading = useEazo((s) => s.auth.loading);

  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    listPlans()
      .then((rows) => {
        if (!cancelled) setPlans(rows);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="flex min-h-full flex-col bg-background lm-topo">
      <AppHeader />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-10 pt-6" data-el="home-main">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          {t("home.eyebrow")}
        </p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight text-foreground">
          {t("home.title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("home.subtitle")}
        </p>

        <div className="mt-6 space-y-3" data-el="home-start-options">
          <Link
            href="/analyze?mode=photo"
            data-el="home-start-photo"
            className="flex items-center gap-3 border-2 border-foreground bg-card p-4 lm-hard-shadow transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-primary-foreground">
              <Camera className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-foreground">
                {t("home.startPhoto")}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("home.startPhotoDesc")}
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
          </Link>

          <Link
            href="/analyze?mode=text"
            data-el="home-start-text"
            className="flex items-center gap-3 border-2 border-foreground bg-card p-4 lm-hard-shadow transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-secondary text-secondary-foreground">
              <PenLine className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-foreground">
                {t("home.startText")}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("home.startTextDesc")}
              </span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
          </Link>
        </div>

        <div className="mt-8" data-el="home-recent">
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-foreground">
            {t("home.recentTitle")}
          </h2>

          {!authLoading && !user ? (
            <button
              type="button"
              onClick={() => auth.login().catch(() => undefined)}
              data-el="home-signin"
              className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-border bg-card px-4 py-5 text-sm text-muted-foreground"
            >
              <UserRound className="h-4 w-4" aria-hidden />
              {t("home.signInPrompt")}
            </button>
          ) : failed ? (
            <p className="border border-dashed border-border p-4 text-sm text-destructive">
              {t("home.loadFailed")}
            </p>
          ) : loading ? (
            <ul className="space-y-2.5" aria-hidden>
              {[0, 1].map((i) => (
                <li key={i} className="h-[76px] animate-pulse border border-border bg-card/60" />
              ))}
            </ul>
          ) : plans.length === 0 ? (
            <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">
              {t("home.recentEmpty")}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {plans.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/plan/${p.id}`}
                    data-el="home-recent-item"
                    className="flex items-center gap-3 border border-border bg-card p-2.5 transition-colors hover:border-foreground"
                  >
                    <span className="relative h-14 w-12 shrink-0 overflow-hidden border border-border bg-muted">
                      {p.coverImageUrl ? (
                        <Image
                          src={p.coverImageUrl}
                          alt={p.subjectName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center font-mono text-[10px] text-muted-foreground">
                          {t("home.sourceText")}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {p.subjectName}
                      </span>
                      <span className="mt-0.5 flex flex-wrap gap-1">
                        <span className="bg-accent/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent-foreground">
                          {p.source === "photo"
                            ? t("home.sourcePhoto")
                            : t("home.sourceText")}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {p.faceShape}
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
