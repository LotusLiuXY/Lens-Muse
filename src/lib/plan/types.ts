// Domain types for LensMuse shoot-plan generator.
// Section content is dynamic (generated per subject), so it lives as data, not i18n copy.

export type PlanSectionKey =
  | "features"
  | "makeup"
  | "hair"
  | "temperament"
  | "wardrobe"
  | "scene"
  | "shots"
  | "photographer";

export interface FeatureTrait {
  label: string; // e.g. 脸型 / 眼型
  value: string; // e.g. 鹅蛋脸偏方
  note?: string; // interpretation
}

export interface ShotSpec {
  scene: string; // 场景名
  camera: string; // 机位
  framing: string; // 景别
  light: string; // 光线
  angle: string; // 角度
  pose: string; // 姿势引导
  composition: string; // 构图要点
}

export interface PhotographerCase {
  style: string; // 风格名
  vibe: string; // 代表特征
  reference: string; // 可参照拍法要点
}

export interface PlanSection {
  key: PlanSectionKey;
  index: number; // 1..8
  title: string;
  subtitle: string;
  summary: string;
  bullets: string[];
  imageUrl?: string;
  traits?: FeatureTrait[];
  shots?: ShotSpec[];
  cases?: PhotographerCase[];
}

export interface ShootPlan {
  id: string;
  subjectName: string;
  source: "photo" | "text";
  faceShape: string;
  temperamentTags: string[];
  coverImageUrl?: string;
  createdAt: string;
  sections: PlanSection[];
}

export const SECTION_ORDER: PlanSectionKey[] = [
  "features",
  "makeup",
  "hair",
  "temperament",
  "wardrobe",
  "scene",
  "shots",
  "photographer",
];
