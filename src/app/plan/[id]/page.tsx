"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useEazo } from "@eazo/sdk/react";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { PlanSectionCard } from "@/components/plan/plan-section-card";
import { getPlan, type PlanDetail } from "@/lib/api";

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation();
  const user = useEazo((s) => s.auth.user);
  const authLoading = useEazo((s) => s.auth.loading);

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setStatus("loading");
    });
    getPlan(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) setStatus("notfound");
        else {
          setPlan(p);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("notfound");
      });
    return () => {
      cancelled = true;
    };
  }, [id, authLoading, user]);

  return (
    <div className="flex min-h-full flex-col bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-12 pt-4" data-el="plan-main">
        <Link
          href="/"
          data-el="plan-back"
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("plan.back")}
        </Link>

        {status === "loading" && (
          <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("plan.loading")}
          </p>
        )}

        {status === "notfound" && (
          <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("plan.notFound")}
          </p>
        )}

        {status === "ready" && plan && (
          <>
            <div
              className="flex gap-4 border-2 border-foreground bg-card p-3 lm-hard-shadow"
              data-el="plan-summary"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-border bg-muted">
                {plan.coverImageUrl ? (
                  <Image
                    src={plan.coverImageUrl}
                    alt={plan.subjectName}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center font-mono text-[10px] text-muted-foreground">
                    {t("home.sourceText")}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("plan.subject")}
                </div>
                <div className="truncate text-lg font-semibold text-foreground">
                  {plan.subjectName}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("plan.faceShape")}: {plan.faceShape}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {plan.temperamentTags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-accent/60 px-1.5 py-0.5 font-mono text-[10px] text-accent-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2.5" data-el="plan-sections">
              {plan.sections.map((section, i) => (
                <PlanSectionCard key={section.key} section={section} defaultOpen={i === 0} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
