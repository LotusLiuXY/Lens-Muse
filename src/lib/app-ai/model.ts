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
