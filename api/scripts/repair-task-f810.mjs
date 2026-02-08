import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'data', 'meeting_tool.db');
const db = new Database(dbPath);

const taskId = 'f810d878-d68d-4601-a3a1-c84f3bb94f46';
const now = Date.now();

// Constructed from log analysis (Attempt 3 + fixes)
const repairedResult = {
  id: taskId,
  title: "翻译质量提升方案讨论会",
  date: "2023-11-15",
  duration: "45分钟",
  uploadTime: new Date(1770485914425).toISOString(),
  participants: [
    { name: "主持人", role: "会议组织者" },
    { name: "成员A", role: "翻译技术专家" },
    { name: "成员B", role: "产品经理" }
  ],
  summaryOverview: "本次会议主要讨论了如何通过案例展示大模型翻译与传统机器翻译的差异，确定了放弃使用表格转而采用三针案例对比展示的方案，并选用谷歌demo作为理想效果参考基准。",
  summaryGroups: [
    {
      id: uuidv4(),
      title: "核心目标",
      modules: [
        {
          id: uuidv4(),
          title: "Core",
          icon: "Target",
          type: "Core",
          color: "indigo",
          points: [
            "重点讨论大模型翻译与传统翻译满足率对比",
            "确定以案例展示而非表格形式呈现差异"
          ]
        }
      ]
    },
    {
      id: uuidv4(),
      title: "技术方案",
      modules: [
        {
          id: uuidv4(),
          title: "Tech",
          icon: "Cpu",
          type: "Tech",
          color: "sky",
          points: [
            "采用三针展示法：原文/现状/目标",
            "使用谷歌demo作为理想效果基准"
          ]
        }
      ]
    },
    {
      id: uuidv4(),
      title: "设计优化",
      modules: [
        {
          id: uuidv4(),
          title: "Design",
          icon: "Palette",
          type: "Design",
          color: "amber",
          points: [
            "副标题位置调整至'完美贴合'和'清晰'部分下方",
            "强调显性差异的可视化呈现"
          ]
        }
      ]
    }
  ],
  summaryDetails: [
    {
      key: "讨论大模型翻译与传统机器翻译的满足率对比",
      description: "建议用小字说明具体数值，并通过案例展示两者在贴合度和清晰度上的差异。"
    },
    {
      key: "展示方式改进",
      description: "确定放弃使用表格，改用三针展示（原文、现状、改进目标），以体现显性差异。"
    }
  ],
  todoList: [
    {
      id: uuidv4(),
      content: "找更合适的案例（case）来展示翻译质量的差异，尤其是贴合度和清晰度",
      assignee: "未分配",
      completed: false
    },
    {
      id: uuidv4(),
      content: "调整第二页的标题和案例",
      assignee: "未分配",
      completed: false
    }
  ],
  smartChapters: [],
  keyDecisions: [],
  goldenMoments: [],
  aiDisclaimer: "本纪要由AI助手根据提供的会议笔记自动生成，可能存在理解偏差或遗漏。请与会者核对关键信息与待办事项，并反馈更正。"
};

const stmt = db.prepare(`
  INSERT OR REPLACE INTO tasks (id, status, created_at, updated_at, progress, stage, result, logs, metrics)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Create dummy logs
const logs = [
  { stage: 'INIT', at: now - 100000, message: 'Task repaired manually' },
  { stage: 'COMPLETED', at: now, message: 'Task data reconstructed from logs' }
];

const metrics = {
  totalDurationMs: 134004,
  asrDurationMs: 4921,
  mapDurationMs: 33790
};

stmt.run(
  taskId,
  'completed',
  now - 134004,
  now,
  100,
  'Completed (Repaired)',
  JSON.stringify(repairedResult),
  JSON.stringify(logs),
  JSON.stringify(metrics)
);

console.log(`Task ${taskId} repaired and inserted into DB.`);
