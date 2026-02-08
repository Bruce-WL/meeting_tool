import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = path.join(process.cwd(), 'data', 'meeting_tool.db');
const db = new Database(dbPath);

const taskId = 'd3099a1d-5f2c-4ea3-aec4-8fc019526c1f';
const now = Date.now();

// Constructed from log analysis
const repairedResult = {
  id: taskId,
  title: "产品优化与翻译需求论证会议",
  date: "2023-11-15",
  duration: "60分钟",
  uploadTime: new Date(1770482854613).toISOString(), // Approx
  participants: [
    { name: "产品团队", role: "参与者" },
    { name: "研发团队", role: "参与者" },
    { name: "海外产品团队", role: "参与者" },
    { name: "测试团队", role: "参与者" },
    { name: "何艳华", role: "负责人" }
  ],
  summaryOverview: "本次会议聚焦于产品优化的核心需求论证，特别是翻译产品的性能目标和海外场景优先级。会议明确了翻译产品的关键指标（响应速度1秒内，准确率95%），讨论了菜单和交通提示等特定场景的翻译挑战，并强调了需求定义清晰性和技术可行性对齐的重要性。",
  summaryGroups: [
    {
      id: uuidv4(),
      title: "核心目标",
      modules: [
        {
          id: uuidv4(),
          title: "目标设定",
          icon: "Target",
          type: "Core",
          color: "indigo",
          points: [
            "明确翻译产品的关键指标：响应速度1秒内，准确率95%。",
            "强调需求论证是首要任务，避免无意义的优化。"
          ]
        }
      ]
    },
    {
      id: uuidv4(),
      title: "技术可行性",
      modules: [
        {
          id: uuidv4(),
          title: "研发对齐",
          icon: "Cpu",
          type: "Tech",
          color: "sky",
          points: [
            "与研发团队对齐技术可行性，特别是95%准确率目标的实现可能性。",
            "讨论网络问题导致的翻译失败率改进（从5%降到0.1%）。"
          ]
        }
      ]
    },
    {
      id: uuidv4(),
      title: "海外场景聚焦",
      modules: [
        {
          id: uuidv4(),
          title: "场景优先级",
          icon: "Users",
          type: "Focus",
          color: "amber",
          points: [
            "优先处理Top 3-4海外场景（如菜单、路牌）。",
            "标准菜单（如宫保鸡丁）应有标准翻译，非标准菜名暂不处理。",
            "交通提示需要先明确意图识别或额外训练模型。"
          ]
        }
      ]
    },
    {
      id: uuidv4(),
      title: "风险管理",
      modules: [
        {
          id: uuidv4(),
          title: "需求定义",
          icon: "Shield",
          type: "Risk",
          color: "rose",
          points: [
            "避免过于宽泛的目标定义（如'世界第一'），强调需求清晰性。",
            "分析历史翻译失败原因，明确'好产品'的评判标准。"
          ]
        }
      ]
    }
  ],
  summaryDetails: [
    {
      key: "需求论证与核心目标",
      description: "会议强调了产品优化的核心在于用户需求的严谨论证，避免无意义的优化（'雕花'）。明确了翻译产品的目标为响应速度1秒内和翻译准确率95%，并聚焦海外场景的Top 3-4用例（如菜单、路牌）。"
    }
  ],
  todoList: [
    {
      id: uuidv4(),
      content: "需求论证：团队需收集外部论文、GPT或用户数据，明确翻译需求的强度",
      assignee: "产品团队",
      completed: false
    },
    {
      id: uuidv4(),
      content: "目标对齐：与研发同学核对技术可行性（如95%准确率是否可实现）",
      assignee: "研发团队",
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
  asrDurationMs: 9742,
  mapDurationMs: 25993
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
