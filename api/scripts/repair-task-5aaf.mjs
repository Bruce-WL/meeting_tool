import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'data', 'meeting_tool.db');
const db = new Database(dbPath);

const taskId = '5aaf8cb0-3071-440f-a7b2-df1a7a6ed614';
const now = Date.now();

// Constructed from log analysis (Attempt 3 + fixes)
const repairedResult = {
  id: taskId,
  title: "翻译产品需求与技术可行性讨论会议",
  date: "2023-10-25",
  duration: "60分钟",
  uploadTime: new Date(1770484321677).toISOString(),
  participants: [
    { name: "何艳华", role: "产品负责人" }
  ],
  summaryOverview: "本次会议聚焦翻译产品的需求定义与技术可行性论证，强调需严谨论证用户需求而非仅依赖反馈，设定了95%翻译准确率的高目标并讨论可行性调整（可能下调至90%-92%），明确了优先聚焦海外Top 3-4场景（如菜单、路牌），并要求定义清晰的产品测试标准。",
  summaryGroups: [
    {
      id: uuidv4(),
      title: "核心目标",
      modules: [
        {
          id: uuidv4(),
          title: "竞争力目标",
          icon: "Target",
          type: "Core",
          color: "indigo",
          points: [
            "设定了95%翻译准确率的竞争力目标，并讨论可行性（可能下调至90%-92%）。",
            "强调需求论证需结合论文/GPT/用户数据等多元方式。"
          ]
        }
      ]
    },
    {
      id: uuidv4(),
      title: "技术架构",
      modules: [
        {
          id: uuidv4(),
          title: "研发对齐",
          icon: "Cpu",
          type: "Tech",
          color: "sky",
          points: [
            "需与研发对齐技术可行性（模型手段/准确率上限）。",
            "识别技术不可行选项（如特定复杂场景翻译）。"
          ]
        }
      ]
    },
    {
      id: uuidv4(),
      title: "需求聚焦",
      modules: [
        {
          id: uuidv4(),
          title: "海外场景",
          icon: "Users",
          type: "Focus",
          color: "amber",
          points: [
            "优先海外Top 3-4场景：菜单/路牌/交通信息。",
            "标准菜系翻译需确保高准确率（如宫保鸡丁）。"
          ]
        }
      ]
    },
    {
      id: uuidv4(),
      title: "质量指标",
      modules: [
        {
          id: uuidv4(),
          title: "核心指标",
          icon: "Shield",
          type: "Risk",
          color: "rose",
          points: [
            "定义‘好产品’核心指标：响应速度/准确率/渲染效果。",
            "设定失败率降低目标（5%→0.1%）。"
          ]
        }
      ]
    }
  ],
  summaryDetails: [
    {
      key: "用户需求与技术可行性",
      description: "会议强调了严谨的用户需求论证的重要性，指出不应仅依赖用户反馈进行产品优化。设定了翻译准确率95%的高目标作为产品竞争力方向，但也讨论了技术可行性的调整空间（可能下调至90%-92%）。海外翻译场景应聚焦核心需求（如菜单、路牌等），以避免资源分散。"
    }
  ],
  todoList: [
    {
      id: uuidv4(),
      content: "补充分需求论证（通过论文、GPT、用户数据等）",
      assignee: "未分配",
      completed: false
    },
    {
      id: uuidv4(),
      content: "与研发对齐技术可行性（翻译准确率、模型手段）",
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
  asrDurationMs: 10689,
  mapDurationMs: 24147
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
