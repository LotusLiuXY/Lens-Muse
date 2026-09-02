"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Aperture, Languages } from "lucide-react";
import { UserBadge } from "@/components/user-profile/user-badge";
import {
  changeLocale,
  getLocalePreference,
  normalizeLocale,
  type LocaleCode,
  type LocalePreference,
} from "@/i18n";

// App-specific header styled to the "规格清单" spec-sheet design tokens.
export function AppHeader() {
  const { t, i18n } = useTranslation();

  const subscribe = useCallback(
    (sync: () => void) => {
      i18n.on("languageChanged", sync);
      window.addEventListener("eazo-locale-preference-changed", sync);
      window.addEventListener("storage", sync);
      return () => {
        i18n.off("languageChanged", sync);
        window.removeEventListener("eazo-locale-preference-changed", sync);
        window.removeEventListener("storage", sync);
      };
    },
    [i18n],
  );

  const preference = useSyncExternalStore(
    subscribe,
    getLocalePreference,
    () => "system" as LocalePreference,
  );

  async function handleChange(value: string) {
    if (value === "system") {
      await changeLocale("system");
      return;
    }
    const locale = normalizeLocale(value);
    if (locale) await changeLocale(locale as LocaleCode);
  }

  return (
    <header
      data-el="app-header"
      className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-foreground bg-background px-4"
      style={{ paddingTop: "max(12px, env(safe-area-inset-top, 0px))", paddingBottom: 12 }}
    >
      <Link href="/" data-el="app-header-logo" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center bg-primary text-primary-foreground">
          <Aperture className="h-4 w-4" aria-hidden />
        </span>
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          {t("app.name")}
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 border border-border bg-card px-2 py-1">
          <Languages className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <label htmlFor="app-locale" className="sr-only">
            {t("language.label")}
          </label>
          <select
            id="app-locale"
            data-el="app-header-locale"
            value={preference}
            onChange={(e) => void handleChange(e.target.value)}
            className="cursor-pointer bg-transparent font-mono text-xs font-medium text-foreground outline-none"
          >
            <option value="system">{t("language.followSystem")}</option>
            <option value="en-US">{t("language.enUS")}</option>
            <option value="zh-CN">{t("language.zhCN")}</option>
          </select>
        </div>
        <UserBadge />
      </div>
    </header>
  );
}
