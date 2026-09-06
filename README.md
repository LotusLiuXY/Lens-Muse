# LensMuse · 人像拍摄方案生成器

输入一张人脸照片或一段文字描述，LensMuse 会分析五官与气质，生成一整套结构化的人像拍摄企划方案——涵盖五官分析、妆容、发型造型、气质定位、服装、场景、分点位拍摄细节与摄影师风格案例，共 8 个可逐段展开的章节。

预览地址：https://3000-iaa75j5qfkcxi1v47mtuz.e2b.app

---

## ✨ 功能特性

- **两种起点**：上传照片，或填写脸型 / 气质 / 风格方向等文字描述。
- **结构化方案**：自动产出 8 章节拍摄企划，卡片可就地平滑展开 / 折叠。
- **分点位拍摄细节**：每个推荐场景给出机位、景别、光线、角度、姿势、构图。
- **摄影师风格案例**：内置本地风格库，匹配对应的拍摄参考。
- **历史记录**：登录后自动保存并回看最近生成的方案。
- **瑞士网格设计**：靛蓝 (#3B38EB) + 背景灰 (#E9E9E8) 的编辑排版数据海报风格，等宽标号 + 硬阴影。
- **多语言**：内置简体中文 / 英文，可在顶栏切换。

## 🧱 技术栈

- **框架**：Next.js（App Router）+ React + TypeScript
- **样式**：Tailwind CSS + shadcn 设计令牌
- **动效**：Framer Motion
- **数据库**：PostgreSQL + Drizzle ORM
- **平台能力**：Eazo SDK（登录鉴权、对象存储、分享）
- **国际化**：react-i18next（`en-US` / `zh-CN`）

## 📁 目录结构

```
src/
  app/                    # 路由与页面
    page.tsx              # 首页：起点选择 + 最近方案
    analyze/              # 分析输入页（上传照片 / 填写描述）
    plan/[id]/            # 方案详情页（8 章节卡片）
    api/plans/            # 方案生成与读取接口
  components/             # 共享组件（导航、方案卡、封面动效等）
  lib/
    plan/generate.ts      # 方案生成逻辑
    db/                   # Drizzle 表结构与查询
    i18n/                 # 多语言
  i18n/locales/           # 语言文案 (en-US / zh-CN)
```

## 🚀 本地运行

> 需要 Node.js 与 [Bun](https://bun.sh/)。

```bash
# 1. 安装依赖
bun install

# 2. 配置环境变量（复制模板后按需填写）
cp .env.example .env

# 3. 初始化数据库（如使用本地/远程 Postgres）
bun run db:generate
bun run db:migrate

# 4. 启动开发服务器
bun run dev
```

开发服务器默认运行在 http://localhost:3000。

## ⚙️ 环境变量

请参考仓库中的 `.env.example`。关键变量包括：

- `DATABASE_URL` —— PostgreSQL 连接串（服务端使用，请勿提交到仓库）。
- `EAZO_PRIVATE_KEY` —— Eazo 开发者私钥，用于服务端解密用户会话令牌。
- AI 模型来源（可选）—— 如需接入 AI 智能分析，可配置对应模型来源；未配置时使用内置规则生成方案。

> ⚠️ `.env` 已在 `.gitignore` 中忽略，切勿将真实密钥提交到仓库。

## 🧠 方案生成说明

- **已接入 AI 模型时**：照片模式经视觉模型识别五官气质，文字模式经文本模型撰写方案。
- **未接入 AI 模型时**：根据用户填写的字段，通过内置规则引擎（气质档案库 + 机位预设）拼装完整的 8 章节方案，功能即时可用。

## 🚢 部署到 Vercel

1. 打开 https://vercel.com/new 并用 GitHub 账号登录。
2. 导入本仓库 `LotusLiuXY/Lens-Muse`。
3. 在项目设置的 Environment Variables 中配置 `DATABASE_URL`、`EAZO_PRIVATE_KEY` 等变量。
4. 点击 Deploy，后续推送到 `main` 分支会自动触发部署。

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。
