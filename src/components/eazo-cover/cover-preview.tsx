"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Aperture } from "lucide-react";
import { COVER_PREVIEW_DATA as D } from "./cover-data";

// Autonomous ~4s loop: the numbered spec cards land, then card 07 expands to
// reveal its per-shot detail — the app's signature interaction. No auth, no
// product handlers, no storage. Preview-only local state machine.
export function CoverPreview() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let t2: ReturnType<typeof setTimeout>;
    const t1 = setTimeout(() => {
      setOpen(true);
      t2 = setTimeout(() => setOpen(false), 2400);
    }, 1200);
    const loop = setInterval(() => {
      setOpen(true);
      setTimeout(() => setOpen(false), 2400);
    }, 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(loop);
    };
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#E9E9E8] p-4">
      <div className="w-full max-w-[340px]">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-[#3B38EB] text-[#FAFAF7]">
            <Aperture className="h-3.5 w-3.5" />
          </span>
          <span className="font-mono text-sm font-semibold text-[#212725]">{D.subject}</span>
        </div>

        <div className="space-y-2">
          {D.sections.map((s) => {
            const isTarget = s.idx === "07";
            return (
              <div
                key={s.idx}
                className="border-2 border-[#212725] bg-[#FAFAF7]"
                style={{ boxShadow: "3px 3px 0 #3B38EB" }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="font-mono text-base font-semibold text-[#3B38EB]">{s.idx}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#212725]">
                      {s.title}
                    </span>
                    <span className="block font-mono text-[10px] uppercase tracking-wide text-[#5C6264]">
                      {s.sub}
                    </span>
                  </span>
                  <ChevronDown
                    className="h-4 w-4 text-[#212725] transition-transform duration-300"
                    style={{ transform: isTarget && open ? "rotate(180deg)" : "none" }}
                  />
                </div>
                {isTarget && (
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <dl className="divide-y divide-[#CFCFCA] border-t-2 border-dashed border-[#CFCFCA]">
                          {D.detail.map(([k, v]) => (
                            <div key={k} className="flex gap-3 px-3 py-1.5">
                              <dt className="w-14 shrink-0 font-mono text-[10px] uppercase leading-5 tracking-wide text-[#5C6264]">
                                {k}
                              </dt>
                              <dd className="text-[13px] leading-5 text-[#212725]">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
