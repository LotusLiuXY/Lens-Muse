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

// ---------------------------------------------------------------------------
// Rule-based generator (no AI). Builds a complete, professional 8-section plan
// from the fields the user provides on the analyze form. Used whenever the App
// AI model source is not configured, so the generate flow always returns a
// usable structured plan.
// ---------------------------------------------------------------------------

const VIBE_LIBRARY: Record<string, { tags: string[]; makeup: string; hair: string; wardrobe: string; scenes: string[]; styles: PhotographerCase[] }> = {
  清冷: {
    tags: ["清冷", "疏离", "都市"],
    makeup: "冷调哑光底妆，强调眼神与轮廓，唇色选豆沙冷棕。",
    hair: "中分直发或湿发效果，露出额头与下颌线，突出骨相。",
    wardrobe: "冷色系利落廓形，金属细链等极简配饰。",
    scenes: ["夜色都市玻璃幕墙", "极简室内冷光棚", "雨后街道霓虹倒影"],
    styles: [
      { style: "冷调都市纪实", vibe: "疏离克制", reference: "低饱和、硬光、留白构图" },
      { style: "极简肖像", vibe: "干净锐利", reference: "单色背景、正面眼神特写" },
      { style: "夜景霓虹", vibe: "electric", reference: "彩色光斑、湿地反射" },
    ],
  },
  温柔: {
    tags: ["温柔", "治愈", "日系"],
    makeup: "奶油肌底妆，粉橘腮红与果冻唇，营造通透感。",
    hair: "自然卷或空气刘海，蓬松柔软，弱化棱角。",
    wardrobe: "浅色针织、棉麻材质，柔和廓形，减少硬朗配饰。",
    scenes: ["午后暖光房间", "花田 / 草地逆光", "咖啡馆窗边"],
    styles: [
      { style: "日系空气感", vibe: "柔和治愈", reference: "逆光、高调曝光、浅景深" },
      { style: "胶片日常", vibe: "温暖颗粒", reference: "暖色调、自然抓拍" },
      { style: "花草场景", vibe: "清新", reference: "前景虚化花草、柔光" },
    ],
  },
  高级: {
    tags: ["高级", "克制", "时装"],
    makeup: "雾面精致底妆，立体修容，强调整体质感而非单点。",
    hair: "利落包发或大背头，干净利落，突出线条。",
    wardrobe: "剪裁考究的西装 / 缎面礼服，材质与版型为主。",
    scenes: ["纯色影棚硬光", "建筑几何空间", "艺术画廊"],
    styles: [
      { style: "时装大片", vibe: "冷峻高级", reference: "硬光、强对比、姿态张力" },
      { style: "极简影棚", vibe: "克制", reference: "纯色背景、结构化姿势" },
      { style: "建筑几何", vibe: "线条感", reference: "利用建筑线条构图" },
    ],
  },
};

function pickVibe(input: AnalyzeInput) {
  const key = `${input.vibe ?? ""}${input.direction ?? ""}`;
  for (const k of Object.keys(VIBE_LIBRARY)) {
    if (key.includes(k)) return VIBE_LIBRARY[k];
  }
  return VIBE_LIBRARY["清冷"];
}

function buildShots(scenes: string[]): ShotSpec[] {
  const presets = [
    { camera: "35mm 定焦", framing: "半身景别", light: "侧顺光 45°", angle: "平视微仰", pose: "重心偏移、手部自然", composition: "三分法留白" },
    { camera: "85mm 定焦", framing: "近景特写", light: "柔光箱主光", angle: "略俯拍", pose: "侧脸回眸", composition: "中心构图、浅景深" },
    { camera: "50mm 定焦", framing: "全身景别", light: "环境光 + 反光板补光", angle: "低机位", pose: "行走 / 动态", composition: "引导线构图" },
  ];
  return scenes.map((scene, i) => ({ scene, ...presets[i % presets.length] }));
}

function buildRulePlan(input: AnalyzeInput): RawPlan {
  const v = pickVibe(input);
  const face = input.faceShape || "鹅蛋脸";
  const name = input.name || "未命名人物";
  return {
    subjectName: name,
    faceShape: face,
    temperamentTags: v.tags,
    features: {
      summary: `以「${v.tags.join(" · ")}」为核心气质，围绕 ${face} 的骨相特征展开造型与拍摄。`,
      bullets: [`脸型：${face}，构图中善用留白与侧脸线条`, "镜头优先呈现眼神与下颌线"],
      traits: [
        { label: "脸型", value: face, note: "根据轮廓选择景别" },
        { label: "眼型", value: input.vibe?.includes("清冷") ? "上扬丹凤" : "自然杏眼", note: "眼神为画面重心" },
        { label: "鼻型", value: "直挺适中", note: "侧脸更显立体" },
        { label: "唇形", value: "唇峰明显", note: "唇色随妆容调整" },
        { label: "脸部比例", value: "三庭均衡", note: "利落线条更佳" },
        { label: "肤色调", value: input.vibe?.includes("温柔") ? "暖调" : "冷调", note: "决定底妆与色温" },
      ],
    },
    makeup: { summary: v.makeup, bullets: ["底妆贴合肤色调", "重点强调眼神或唇部之一", "避免过度堆叠"] },
    hair: { summary: v.hair, bullets: ["发型服务于脸型与气质", "保持整洁的发际线"] },
    temperament: { summary: `${name} 的关键词：${v.tags.join(" · ")}。`, bullets: v.tags },
    wardrobe: { summary: v.wardrobe, bullets: ["色系与气质统一", "材质与版型优先于图案", "配饰点到为止"] },
    scene: { summary: "根据气质推荐 3 个场景方向。", bullets: v.scenes },
    shots: { summary: "每个推荐场景对应一套机位方案。", items: buildShots(v.scenes) },
    photographer: { summary: "匹配的摄影风格案例，可作为拍摄参考。", cases: v.styles },
  };
}

export async function generatePlan(
  input: AnalyzeInput,
  viewerUserId: string,
): Promise<GeneratedPlan> {
  // No AI model source configured -> use the rule-based generator so the
  // generate flow still returns a complete, usable plan.
  if (!isAppAiConfigured()) {
    const raw = buildRulePlan(input);
    return {
      subjectName: (raw.subjectName || input.name || "未命名人物").slice(0, 60),
      faceShape: raw.faceShape || input.faceShape || "—",
      temperamentTags: arr(raw.temperamentTags).slice(0, 3),
      sections: buildSections(raw),
    };
  }

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
