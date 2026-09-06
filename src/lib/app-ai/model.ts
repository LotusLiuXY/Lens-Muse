// Server-side only. Resolves the App AI model key for a given capability
// from EAZO_AI_MODELS_JSON (set by the platform when the creator picked models).
export type AiCapability = "text" | "vision" | "image_generation";

export function modelForCapability(capability: AiCapability): string {
  const raw = process.env.EAZO_AI_MODELS_JSON;
  if (raw) {
    try {
      const map = JSON.parse(raw) as Record<string, string>;
      if (typeof map[capability] === "string" && map[capability]) {
        return map[capability];
      }
    } catch {
      // fall through
    }
  }
  return process.env.EAZO_AI_MODEL_KEY || "google.gemma-3-12b-it";
}

/**
 * Whether a usable App AI model source is configured for the given capability
 * (or any capability when omitted). Considers BYOK, the capability routing map,
 * and the legacy single-model fallback. When nothing is configured the app
 * falls back to the rule-based generator instead of calling the AI proxy.
 */
export function isAppAiConfigured(capability?: AiCapability): boolean {
  if (process.env.AI_PROVIDER_MODEL) return true;
  if (process.env.EAZO_AI_MODEL_KEY) return true;
  const raw = process.env.EAZO_AI_MODELS_JSON;
  if (!raw) return false;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    if (capability) return typeof map[capability] === "string" && !!map[capability];
    return Object.values(map).some((v) => typeof v === "string" && !!v);
  } catch {
    return false;
  }
}
