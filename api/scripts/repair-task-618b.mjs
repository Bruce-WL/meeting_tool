import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'data', 'meeting_tool.db');
const db = new Database(dbPath);

const taskId = '618b47e4-cafd-417c-9e80-b0dd9116ffce';
const now = Date.now();

// Constructed from log analysis (Attempt 3 + fixes)
const repairedResult = {
  id: taskId,
  title: "大模型与传统机器翻译效果对比讨论会",
  date: "2023-11-15",
  duration: "60分钟",
  uploadTime: new Date(1770486486181).toISOString(),
  participants: [
    { name: "参与者A", role: "项目经理" },
    { name: "参与者B", role: "技术专家" },
    { name: "参与者C", role: "设计负责人" }
  ],
  summaryOverview: "本次会议重点讨论了大模型翻译与传统机器翻译的效果对比，决定通过案例对比的方式直观展示质量差异，并确定了三张图（原文、现状、改进目标）的展示形式和副标题调整方案。",
  summaryGroups: [
    {
      id: uuidv4(),
      title: "翻译效果对比",
      modules: [
        {
          id: uuidv4(),
          title: "核心目标",
          icon: "Target",
          type: "Core",
          color: "indigo",
          points: [
            "通过案例对比展示大模型翻译的质量优势",
            "重点突出'完美贴合'和'清晰'的差异"
          ]
        },
        {
          id: uuidv4(),
          title: "展示形式",
          icon: "Palette",
          type: "Design",
          color: "sky",
          points: [
            "使用三张图（原文、现状、改进目标）展示翻译效果变化",
            "调整副标题位置至'完美贴合'和'清晰'部分下方"
          ]
        }
      ]
    }
  ],
  summaryDetails: [
    {
      key: "翻译效果展示方式",
      description: "讨论了使用大模型翻译与传统机器翻译的满足率对比，决定通过三张图（原文、现状、改进目标）来展示翻译效果的变化。强调大模型翻译的质量优势，尤其是完美贴合和清晰度。"
    },
    {
      key: "副标题调整",
      description: "决定将副标题位置调整至'完美贴合'和'清晰'的描述区块下方，以优化视觉呈现。"
    }
  ],
  todoList: [
    {
      id: uuidv4(),
      content: "找更合适的案例图片，以显性展示翻译效果的差异",
      assignee: "未分配",
      completed: false
    },
    {
      id: uuidv4(),
      content: "修改第二页的标题和案例",
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
  asrDurationMs: 5479,
  mapDurationMs: 27070
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
