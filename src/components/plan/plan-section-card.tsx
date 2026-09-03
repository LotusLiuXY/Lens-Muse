"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { PlanSection } from "@/lib/plan/types";

export function PlanSectionCard({
  section,
  defaultOpen = false,
}: {
  section: PlanSection;
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const idx = String(section.index).padStart(2, "0");

  return (
    <section
      data-el="plan-section-card"
      data-section={section.key}
      className={`overflow-hidden rounded-2xl transition-shadow ${open ? "bg-card lm-hard-shadow" : "lm-glass"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="font-heading text-lg font-extrabold leading-none text-primary">{idx}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-heading text-base font-extrabold text-foreground">
            {section.title}
          </span>
          <span className="block truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {section.subtitle}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-dashed border-border px-4 py-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{section.summary}</p>

              {section.imageUrl && (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
                  <Image
                    src={section.imageUrl}
                    alt={section.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-background">
                    AI ref
                  </span>
                </div>
              )}

              {section.traits && (
                <div className="grid grid-cols-2 gap-2">
                  {section.traits.map((tr) => (
                    <div key={tr.label} className="rounded-xl border border-border bg-background/70 p-2.5">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {tr.label}
                      </div>
                      <div className="text-sm font-semibold text-foreground">{tr.value}</div>
                      {tr.note && (
                        <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                          {tr.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {section.bullets.length > 0 && (
                <ul className="space-y-1.5">
                  {section.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.shots && (
                <div className="space-y-3">
                  {section.shots.map((s, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-xl border border-border bg-background/70"
                      data-el="plan-shot-spec"
                    >
                      <div className="flex items-center justify-between border-b border-border bg-accent/40 px-3 py-1.5">
                        <span className="text-sm font-semibold text-foreground">{s.scene}</span>
                        <span className="text-[10px] text-muted-foreground">
                          #{String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <dl className="divide-y divide-border">
                        {(
                          [
                            ["camera", s.camera],
                            ["framing", s.framing],
                            ["light", s.light],
                            ["angle", s.angle],
                            ["pose", s.pose],
                            ["composition", s.composition],
                          ] as const
                        ).map(([key, val]) => (
                          <div key={key} className="flex gap-3 px-3 py-1.5">
                            <dt className="w-16 shrink-0 text-[10px] uppercase leading-5 tracking-wide text-muted-foreground">
                              {t(`plan.shotHeaders.${key}`)}
                            </dt>
                            <dd className="text-sm leading-5 text-foreground">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              )}

              {section.cases && (
                <div className="space-y-2">
                  {section.cases.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-border bg-background/70 p-3"
                      data-el="plan-photographer-case"
                    >
                      <div className="text-sm font-semibold text-foreground">{c.style}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-secondary">
                        {t("plan.caseHeaders.vibe")}: {c.vibe}
                      </div>
                      <div className="mt-1 text-[13px] leading-snug text-muted-foreground">
                        {t("plan.caseHeaders.reference")}: {c.reference}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
