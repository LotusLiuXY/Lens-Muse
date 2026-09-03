"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { storage, auth, memory } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";
import { toast } from "sonner";
import { ArrowLeft, Camera, PenLine, Upload, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { generatePlan } from "@/lib/api";
import { AppAIClientUnavailableError } from "@/lib/api/app-ai-request";

type Mode = "photo" | "text";

function AnalyzeInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const initialMode: Mode = params.get("mode") === "text" ? "text" : "photo";
  const user = useEazo((s) => s.auth.user);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [faceShape, setFaceShape] = useState("");
  const [vibe, setVibe] = useState("");
  const [direction, setDirection] = useState("");
  const [gender, setGender] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState(false);

  function canSubmit() {
    if (mode === "photo") return photoFile !== null;
    return name.trim().length > 0 && faceShape.trim().length > 0;
  }

  async function handleGenerate() {
    if (!canSubmit()) {
      setError(true);
      return;
    }
    setError(false);

    if (!user) {
      toast.error(t("analyze.signInFirst"));
      auth.login().catch(() => undefined);
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (mode === "photo" && photoFile) {
        setBusyLabel(t("analyze.uploading"));
        const path = `portraits/${user.id}/${Date.now()}-${photoFile.name}`;
        const uploaded = await storage.upload(path, photoFile);
        imageUrl = uploaded.url;
      }

      setBusyLabel(t("analyze.generating"));
      const { id } = await generatePlan({
        source: mode,
        name: name.trim() || undefined,
        imageUrl,
        faceShape: faceShape.trim() || undefined,
        vibe: vibe.trim() || undefined,
        direction: direction.trim() || undefined,
        gender: gender.trim() || undefined,
      });
      memory
        .reportAction({
          content: "User generated a shoot plan",
          event_type: "create",
          page: "analyze",
          metadata: { type: "shoot_plan", source: mode, planId: id },
        })
        .catch(() => {});
      router.push(`/plan/${id}`);
    } catch (err) {
      if (err instanceof AppAIClientUnavailableError) {
        setSubmitting(false);
        setBusyLabel("");
        return;
      }
      toast.error(t("analyze.failed"));
      setSubmitting(false);
      setBusyLabel("");
    }
  }

  return (
    <div className="lm-mesh flex min-h-full flex-col">
      <AppHeader />
      <main className="relative z-[1] mx-auto w-full max-w-md flex-1 px-4 pb-10 pt-4" data-el="analyze-main">
        <button
          type="button"
          onClick={() => router.push("/")}
          data-el="analyze-back"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("analyze.back")}
        </button>

        <h1 className="font-heading text-xl font-extrabold text-foreground">{t("analyze.title")}</h1>

        {/* Mode tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-full lm-glass p-1" data-el="analyze-tabs">
          {(["photo", "text"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                data-el={`analyze-tab-${m}`}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-foreground"
                }`}
              >
                {m === "photo" ? (
                  <Camera className="h-4 w-4" aria-hidden />
                ) : (
                  <PenLine className="h-4 w-4" aria-hidden />
                )}
                {m === "photo" ? t("analyze.tabPhoto") : t("analyze.tabText")}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {mode === "photo" ? (
            <label
              data-el="analyze-upload"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/70 px-4 py-10 text-center"
            >
              <Upload className="h-7 w-7 text-primary" aria-hidden />
              <span className="font-heading text-sm font-bold text-foreground">
                {t("analyze.uploadLabel")}
              </span>
              <span className="text-xs text-muted-foreground">{t("analyze.uploadHint")}</span>
              <span className="mt-1 rounded-full border border-border bg-background px-3 py-1 text-xs">
                {photoFile?.name || t("analyze.uploadPick")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="space-y-4" data-el="analyze-text-form">
              <Field label={t("analyze.nameLabel")}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("analyze.namePlaceholder")}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>
              <Field label={t("analyze.faceShapeLabel")}>
                <input
                  value={faceShape}
                  onChange={(e) => setFaceShape(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>
              <Field label={t("analyze.vibeLabel")}>
                <input
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder={t("analyze.vibePlaceholder")}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>
              <Field label={t("analyze.directionLabel")}>
                <input
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  placeholder={t("analyze.directionPlaceholder")}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>
              <Field label={t("analyze.genderLabel")}>
                <input
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </Field>
            </div>
          )}

          {error && (
            <p className="text-xs font-medium text-destructive">{t("analyze.required")}</p>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={submitting}
            data-el="analyze-generate"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground lm-soft-shadow transition-transform active:scale-[0.98] disabled:opacity-70"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {submitting ? busyLabel || t("analyze.generating") : t("analyze.generate")}
          </button>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-heading text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={null}>
      <AnalyzeInner />
    </Suspense>
  );
}
