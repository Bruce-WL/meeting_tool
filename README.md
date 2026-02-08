# 智能会议纪要生成工具

上传会议录音，自动生成结构化会议纪要。

## 📋 功能概览

### 核心流程
1. **上传音频** - 支持 MP3、WAV、M4A 等格式，最大 50MB
2. **语音识别 (ASR)** - 使用火山引擎模型将音频转为文字
3. **AI 分析** - 使用 LLM 智能分析会议内容
4. **生成结构化纪要** - 包括摘要、章节、待办、关键决策、金句等

### 纪要模块
- **基本信息** - 标题、主题、日期、时长、参会人
- **摘要概览** - 总体概述
- **摘要分组** - 分模块展示要点（会议背景、讨论要点、行动计划等）
- **智能章节** - 时间戳 + 分段摘要，支持跳转
- **待办清单** - 任务列表，可标记完成状态
- **关键决策** - 会议中做出的重要决定
- **金句时刻** - 会议中的精彩发言

---

## 🏗️ 系统架构

### 前端 (React + TypeScript)

| 文件路径 | 功能说明 |
|---------|---------|
| `src/pages/UploadPage.tsx` | 上传页面，支持音频文件上传 |
| `src/pages/MeetingMinutesPage.tsx` | 结果展示页面，轮询获取处理进度和结果 |
| `src/components/UploadSection.tsx` | 文件上传组件 |
| `src/components/Header.tsx` | 会议信息头部 |
| `src/components/SummarySection.tsx` | 摘要展示组件 |
| `src/components/TodoList.tsx` | 待办事项列表 |
| `src/components/SmartChapters.tsx` | 智能章节组件 |
| `src/components/InfoBlock.tsx` | 关键决策/金句展示 |
| `src/api/index.ts` | API 调用封装 |
| `src/types/meeting.ts` | 核心类型定义 |

### 后端 (Express + TypeScript)

| 文件路径 | 功能说明 |
|---------|---------|
| `api/routes/meeting.ts` | 核心处理路由，处理上传和分析请求 |
| `api/services/asrService.ts` | 语音识别服务 |
| `api/services/llmService.ts` | LLM 分析服务 |
| `api/services/taskService.ts` | 任务管理服务 |
| `api/utils/db.ts` | SQLite 数据库封装 |
| `api/utils/logger.ts` | 任务日志记录 |
| `api/server.ts` | 服务器入口 |

---

## 📊 业务流程详解

### 1. 上传阶段

```
用户选择音频文件
    ↓
POST /api/meeting/analyze
    ↓
验证文件类型和大小
    ↓
创建任务记录 (SQLite)
    ↓
返回 taskId 给前端
```

### 2. 后台异步处理

任务创建后立即返回，后台异步执行以下步骤：

#### 步骤 1: ASR 语音识别 (10%)
- 调用 Mify API → 火山引擎 ASR
- 模型: `volc.bigasr.auc_turbo`
- 输出: 带时间戳的文本 (`[mm:ss] 文字内容`)
- 时延监控: `metrics.asrDurationMs`

#### 步骤 2: LLM 分析 (35%-90%)

**Map 阶段 (35%-50%)**
- 将长文本分块 (每块 ~3000 字符)
- 并行处理多个块 (concurrency=3)
- 对每个块生成中间摘要
- 时延监控: `metrics.mapDurationMs`

**Reduce 阶段 (60%-90%)**
- 3 个部分并行生成最终 JSON:

| Part | 生成内容 | 字段 |
|------|---------|------|
| Part 1 | 基本信息、参与者、摘要卡片 | title, date, duration, participants, summaryOverview, summaryGroups |
| Part 2 | 智能章节、详细摘要 | summaryDetails, smartChapters |
| Part 3 | 待办事项、关键决策、金句 | todoList, keyDecisions, goldenMoments |

- 时延监控: `metrics.reduceDurationsMs.part1/2/3`

**Finalize 阶段 (90%+)**
- 合并三个部分的结果
- 数据规范化修复
- 时延监控: `metrics.finalizeDurationMs`

#### 步骤 3: 完成 (100%)
- 更新任务状态为 completed
- 保存完整结果到数据库
- 清理上传的临时文件

### 3. 前端展示

```
轮询 GET /api/meeting/tasks/:id
    ↓
展示处理进度和日志
    ↓
完成后展示结构化纪要
```

---

## 📁 核心数据结构

### MeetingData (完整类型定义见 `src/types/meeting.ts`)

```typescript
{
  // 基本信息
  id: string;                    // 唯一标识
  title: string;                 // 标题
  meetingTopic: string;          // 会议主题
  date: string;                  // 日期 (YYYY-MM-DD HH:mm)
  duration: string;             // 时长
  participants: MeetingParticipant[];  // 参与者列表

  // 摘要模块
  summaryOverview: string;       // 总体概述
  summaryCards: SummaryCard[];   // 摘要卡片
  summaryGroups: SummaryGroup[]; // 摘要分组

  // 智能章节
  smartChapters: SmartChapter[]; // 智能章节列表
  // SmartChapter: { id, timestamp, title, summary }

  // 待办与决策
  todoList: TodoItem[];          // 待办事项
  // TodoItem: { id, content, completed, assignee }
  keyDecisions: string[];       // 关键决策
  goldenMoments: string[];      // 金句时刻
}
```

### TaskStatus (任务状态)

```typescript
{
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;              // 0-100
  stage: string;                 // 当前阶段名称
  result?: MeetingResult;        // 完成后的结果
  error?: string;                // 错误信息
  logs: LogEntry[];              // 处理日志
  metrics: {                     // 时延监控
    startedAt: number;
    asrDurationMs?: number;
    mapDurationMs?: number;
    reduceDurationsMs: { part1?: number; part2?: number; part3?: number };
    finalizeDurationMs?: number;
    totalDurationMs?: number;
  };
}
```

---

## 🔧 技术特点

1. **大文本分块处理**
   - 单块约 3000 字符
   - Map 阶段并行度 3
   - 智能断句，避免切割时间戳

2. **多阶段 LLM 分析 (Map-Reduce)**
   - Map: 并行摘要生成
   - Reduce: 分 3 部分并行生成最终结构化数据
   - 有效缩短长文本处理时间

3. **实时进度追踪**
   - 轮询任务状态
   - 展示详细处理日志
   - 时延监控

4. **结果智能修复**
   - 自动修复不规范的 JSON 返回
   - 同义词归一化 (如 groupName → title)
   - 自动补全缺失字段

5. **可靠性设计**
   - LLM 调用重试机制 (最多 5 次)
   - SQLite 持久化任务状态
   - 临时文件自动清理

---

## ⚙️ 环境变量配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `MIFY_API_KEY` | 是 | - | Mify API Key (用于 ASR 和 LLM) |
| `MIFY_BASE_URL` | 否 | `http://model.mify.ai.srv/v1` | Mify 服务地址 |
| `MIFY_MAP_MODEL_NAME` | 否 | `gpt-5-codex-5` | Map 阶段模型 |
| `MIFY_REDUCE_MODEL_NAME` | 否 | `gpt-5-codex-5` | Reduce 阶段模型 |
| `MIFY_MAP_MODEL_PROVIDER_ID` | 否 | - | Map 阶段 Provider ID |
| `MIFY_REDUCE_MODEL_PROVIDER_ID` | 否 | - | Reduce 阶段 Provider ID |
| `MIFY_SKIP_DNS_LOOKUP` | 否 | - | 设为 `true` 跳过 DNS Lookup |

### ASR 配置
- API URL: `{MIFY_BASE_URL}/audio/transcriptions`
- Provider ID: `volcengine_maas`
- Model: `volc.bigasr.auc_turbo`

---

## 🚀 开发与脚本

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

# 时延测试脚本
node api/scripts/latency-test.mjs /path/to/audio
node api/scripts/latency-test.mjs /path/to/audio http://localhost:3001
```

---

## 🌐 API 接口

### POST /api/meeting/analyze
上传音频文件，开始异步分析

**Request**: `multipart/form-data`
- `audio`: 音频文件

**Response**:
```json
{
  "success": true,
  "taskId": "uuid-xxx",
  "message": "Analysis started in background"
}
```

### GET /api/meeting/tasks/:id
获取任务状态

**Response**:
```json
{
  "id": "uuid-xxx",
  "status": "processing",
  "progress": 50,
  "stage": "LLM Analysis (Map Phase)",
  "logs": [...],
  "metrics": {...}
}
```

### GET /api/meeting/tasks/:id/logs
获取详细任务日志

---

## 📦 部署

项目通过 `vercel.json` 配置：
- `/api/*` 请求转发到服务端 API
- 其余请求走 SPA 的 `index.html`

环境变量可在 Vercel 项目设置中配置。

---

## 📁 项目结构

```
meeting_tool/
├── api/                      # 后端服务
│   ├── routes/              # 路由定义
│   ├── services/            # 业务逻辑服务
│   │   ├── asrService.ts    # 语音识别
│   │   ├── llmService.ts    # LLM 分析
│   │   └── taskService.ts   # 任务管理
│   ├── utils/               # 工具函数
│   ├── server.ts            # 服务入口
│   └── app.ts               # Express 应用
├── src/                     # 前端应用
│   ├── api/                 # API 调用
│   ├── components/          # React 组件
│   ├── pages/               # 页面
│   ├── types/               # 类型定义
│   ├── data/                # 静态数据
│   ├── hooks/               # 自定义 Hooks
│   └── App.tsx              # 应用入口
├── uploads/                 # 上传文件目录
├── logs/                    # 日志文件目录
├── package.json
├── vite.config.ts
└── vercel.json
```
