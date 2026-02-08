# AI 会议纪要

上传会议录音，自动生成结构化会议纪要。前端已具备上传与纪要展示；后端对接大模型后可完成语音转文字与纪要生成。

## 注释

- 适用范围：面向前端与后端联调，关注接口与数据结构。
- 核心数据结构：以 `src/types/meeting.ts` 为准，前后端需保持字段一致。
- 开发环境：本地前后端默认端口分别为 5173/3001，可按需调整。

## 功能概览

- **前端**：上传录音文件（支持 MP3、WAV、M4A，最大 50MB），查看生成的纪要结果页。
- **结果页**：包含以下模块（数据结构见 `src/types/meeting.ts`）：
  - 标题与参会人
  - 总结：要点卡片与分点总结
  - 待办清单
  - 智能章节：时间戳 + 分段摘要（可跳转对应录音位置）
  - 关键决策
  - 金句时刻

## 技术栈

- **前端**：React 18、TypeScript、Vite 6、Tailwind CSS、Lucide React、React Router、Zustand
- **后端**：Express、CORS、dotenv；API 路由见 `api/app.ts`（如 `/api/auth`、`/api/health`）

## 项目结构

- `src/`：页面（`UploadPage`、`MeetingMinutesPage`）、组件（`UploadSection`、`SummarySection`、`SmartChapters`、`TodoList` 等）、类型与模拟数据
- `api/`：Express 应用与路由，本地入口 `server.ts`（默认端口 3001）

## 开发与脚本

```bash
# 安装依赖
npm install

# 本地开发（前端 + 后端并发）
npm run dev

# 仅前端
npm run client:dev

# 仅后端
npm run server:dev

# 重启后端（先结束占用 3001 的进程再启动，改完 LLM/环境变量后使用）
npm run server:restart

# 构建
npm run build

# 预览构建结果
npm run preview

# TypeScript 校验
npm run check

# ESLint
npm run lint
```

## 时延测试脚本

```bash
node api/scripts/latency-test.mjs /path/to/audio
node api/scripts/latency-test.mjs /path/to/audio http://localhost:3001
```

## 环境变量

- **ASR（语音转写）**：`MIFY_API_KEY` — 当前 ASR 使用 Mify 接口，需配置该密钥。
- **LLM（纪要生成，Mify 中转）**：
  - `MIFY_API_KEY`：必填，Mify API Key。
  - `MIFY_BASE_URL`：可选，默认 `http://model.mify.ai.srv/v1`。
  - `MIFY_MAP_MODEL_NAME`：可选，Map 阶段模型名，默认 `gpt-5-codex-5`。
  - `MIFY_REDUCE_MODEL_NAME`：可选，Reduce 阶段模型名，默认 `gpt-5-codex-5`。
  - `MIFY_MAP_MODEL_PROVIDER_ID`：可选，Map 阶段 Provider Id。
  - `MIFY_REDUCE_MODEL_PROVIDER_ID`：可选，Reduce 阶段 Provider Id。

## 部署

项目通过 `vercel.json` 配置：`/api/*` 请求转发到服务端 API，其余走 SPA 的 `index.html`。环境变量可在 Vercel 项目设置中配置。

## 后续扩展

后端接口预留，可接入语音转文字（ASR）与 LLM 生成纪要，详见 `需求描述prd.md`。
