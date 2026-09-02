import { appAi } from "@/lib/eazo-ai-billing";
import { modelForCapability } from "@/lib/app-ai/model";
import type {
  PlanSection,
  PlanSectionKey,
  ShotSpec,
  PhotographerCase,
  FeatureTrait,
} from "@/lib/plan/types";

// Shape the AI is asked to return. Kept flat and explicit so a compact model
// (Gemma 3 12B) can reliably fill it.
interface RawPlan {
  subjectName?: string;
  faceShape?: string;
  temperamentTags?: string[];
  features?: { traits?: FeatureTrait[]; bullets?: string[]; summary?: string };
  makeup?: { summary?: string; bullets?: string[] };
  hair?: { summary?: string; bullets?: string[] };
  temperament?: { summary?: string; bullets?: string[] };
  wardrobe?: { summary?: string; bullets?: string[] };
  scene?: { summary?: string; bullets?: string[] };
  shots?: { summary?: string; items?: ShotSpec[] };
  photographer?: { summary?: string; cases?: PhotographerCase[] };
}

const SECTION_META: Record<PlanSectionKey, { index: number; title: string; subtitle: string }> = {
  features: { index: 1, title: "五官分析", subtitle: "Facial Analysis" },
  makeup: { index: 2, title: "妆容", subtitle: "Makeup" },
  hair: { index: 3, title: "造型 / 发型", subtitle: "Hair & Styling" },
  temperament: { index: 4, title: "气质定位", subtitle: "Temperament" },
  wardrobe: { index: 5, title: "服装", subtitle: "Wardrobe" },
  scene: { index: 6, title: "场景", subtitle: "Scene" },
  shots: { index: 7, title: "分点位拍摄细节", subtitle: "Shot Breakdown" },
  photographer: { index: 8, title: "摄影师风格案例", subtitle: "Photographer Styles" },
};

const SYSTEM_PROMPT = `你是资深人像摄影指导与造型师。根据给定的人物五官/气质信息，产出一整套专业拍摄方案。
严格只输出一个 JSON 对象（不要 markdown、不要额外文字），结构如下：
{
  "subjectName": string,        // 人物名称，若未提供可给一个中性代称
  "faceShape": string,          // 脸型
  "temperamentTags": string[],  // 3 个气质关键词
  "features": { "summary": string, "bullets": string[], "traits": [ {"label": string, "value": string, "note": string} ] }, // traits 含 脸型/眼型/鼻型/唇形/脸部比例/肤色调 共6项
  "makeup": { "summary": string, "bullets": string[] },
  "hair": { "summary": string, "bullets": string[] },
  "temperament": { "summary": string, "bullets": string[] }, // summary 是一句话人设
  "wardrobe": { "summary": string, "bullets": string[] },
  "scene": { "summary": string, "bullets": string[] },        // bullets 为 3 个推荐场景
  "shots": { "summary": string, "items": [ {"scene": string, "camera": string, "framing": string, "light": string, "angle": string, "pose": string, "composition": string} ] }, // 每个推荐场景一条，具体到点位
  "photographer": { "summary": string, "cases": [ {"style": string, "vibe": string, "reference": string} ] } // 3 个匹配的摄影风格案例
}
所有文案使用简体中文，专业、具体、可执行。`;

function extractJson(text: string): RawPlan {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in AI response");
  return JSON.parse(candidate.slice(start, end + 1)) as RawPlan;
}

function arr<T>(v: T[] | undefined): T[] {
  return Array.isArray(v) ? v : [];
}

function buildSections(raw: RawPlan): PlanSection[] {
  const mk = (
    key: PlanSectionKey,
    summary: string,
    bullets: string[],
    extra?: Partial<PlanSection>,
  ): PlanSection => ({
    key,
    index: SECTION_META[key].index,
    title: SECTION_META[key].title,
    subtitle: SECTION_META[key].subtitle,
    summary: summary || "",
    bullets: bullets.filter(Boolean),
    ...extra,
  });

  return [
    mk("features", raw.features?.summary ?? "", arr(raw.features?.bullets), {
      traits: arr(raw.features?.traits),
    }),
    mk("makeup", raw.makeup?.summary ?? "", arr(raw.makeup?.bullets)),
    mk("hair", raw.hair?.summary ?? "", arr(raw.hair?.bullets)),
    mk("temperament", raw.temperament?.summary ?? "", arr(raw.temperament?.bullets)),
    mk("wardrobe", raw.wardrobe?.summary ?? "", arr(raw.wardrobe?.bullets)),
    mk("scene", raw.scene?.summary ?? "", arr(raw.scene?.bullets)),
    mk("shots", raw.shots?.summary ?? "", [], { shots: arr(raw.shots?.items) }),
    mk("photographer", raw.photographer?.summary ?? "", [], {
      cases: arr(raw.photographer?.cases),
    }),
  ];
}

export interface GeneratedPlan {
  subjectName: string;
  faceShape: string;
  temperamentTags: string[];
  sections: PlanSection[];
}

export interface AnalyzeInput {
  source: "photo" | "text";
  name?: string;
  imageDataUrl?: string;
  faceShape?: string;
  vibe?: string;
  direction?: string;
  gender?: string;
}

export async function generatePlan(
  input: AnalyzeInput,
  viewerUserId: string,
): Promise<GeneratedPlan> {
  const userText =
    input.source === "photo"
      ? `请先观察这张人物照片，分析五官与气质，再据此生成完整拍摄方案。若提供了名称：${input.name || "（未提供）"}。`
      : `根据以下文字描述生成完整拍摄方案：
名称：${input.name || "（未提供）"}
脸型：${input.faceShape || "（未提供）"}
气质关键词：${input.vibe || "（未提供）"}
想要的风格方向：${input.direction || "（未提供）"}
性别/年龄段：${input.gender || "（未提供）"}`;

  const capability = input.source === "photo" ? "vision" : "text";
  const content =
    input.source === "photo" && input.imageDataUrl
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: input.imageDataUrl } },
        ]
      : userText;

  const result = await appAi.chat({
    model_key: modelForCapability(capability),
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
    viewer_user_id: viewerUserId,
    temperature: 0.7,
    max_tokens: 2600,
  });

  const text = result?.choices?.[0]?.message?.content ?? "";
  const raw = extractJson(typeof text === "string" ? text : JSON.stringify(text));

  return {
    subjectName: (raw.subjectName || input.name || "未命名人物").slice(0, 60),
    faceShape: raw.faceShape || input.faceShape || "—",
    temperamentTags: arr(raw.temperamentTags).slice(0, 3),
    sections: buildSections(raw),
  };
}
