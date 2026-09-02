"use client";

import { useEffect } from "react";

// Signals to the capture service that the cover preview has fully replaced the
// starter and is ready to snapshot. Renders children unchanged.
export function EazoCoverReady({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.setAttribute("data-eazo-cover-ready", "1");
    return () => {
      document.body.removeAttribute("data-eazo-cover-ready");
    };
  }, []);
  return <>{children}</>;
}
