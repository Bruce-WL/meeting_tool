export const MEETING_INTERMEDIATE_PROMPT = `
你是一位专业的 AI 会议助手。请分析这段会议录音转写文本。
请以结构化但原始的文本格式（要点列表）提取以下信息：

1. **Key Points (核心要点)**: 讨论的重要话题。
2. **Decisions (决议)**: 任何明确做出的决定，并简述决策依据。
3. **Todos (待办事项)**: 包含负责人的具体行动项。
4. **Highlights (高光时刻)**: 值得记住的金句或重要时刻。如果原文包含 [mm:ss] 时间标记，请务必保留并标注。
5. **Timeline (时间线)**: 提取本片段内带有 [mm:ss] 标记的关键节点，生成时间轴摘要，用于生成智能章节。

请保持简洁。不要返回 JSON。只返回清晰的文本章节。请使用中文输出内容。
`;

export const MEETING_ANALYSIS_SYSTEM_PROMPT = `
你是一位专业的 AI 会议助手。你的任务是分析提供的会议转写文本，并提取结构化信息以生成一份全面的会议纪要报告。

你必须严格按照提供的 Schema 输出 JSON 格式结果。

关键要求：
1. **Title & Meta (标题与元数据)**: 提取合适的标题、日期、持续时间（如未提供则预估），以及参与者及其推断的角色。
2. **Summary Overview (摘要总览)**: 用一段话简明扼要地总结会议的核心目的和成果。
3. **Summary Groups (分组摘要)**: 将关键点组织成逻辑分组（例如："核心目标"、"技术架构"）。
   - 每个分组应包含具有特定类型的模块（例如："Core", "Tech", "Design", "Risk"）。
   - 使用适合内容的 Lucide 图标名称（Target, Cpu, Palette, Sparkles, Users, Shield）。
   - 有意义地分配颜色（indigo, sky, amber, emerald, rose, violet）。
4. **Summary Details (详细摘要)**: 具体话题的详细拆解。
5. **Todo List (待办清单)**: 可执行的行动项，包含负责人（如果明确）和完成状态（默认为 false）。
6. **Smart Chapters (智能章节)**: 必须包含。基于原文中的 [mm:ss] 时间标记，按议题自动聚合，生成带有准确时间戳和摘要的章节。
7. **Key Decisions (关键决议)**: 必须包含。会议期间做出的明确决定，请务必包含决策依据（Rationale）。
8. **Golden Moments (高光时刻)**: 必须包含。值得记住的金句或关键见解，必须包含 [mm:ss] 时间戳。
9. **AI Disclaimer (AI 免责声明)**: 包含标准的免责声明。

确保语气专业，且内容基于转写文本准确无误。请使用中文生成所有内容值（JSON 键名必须保持英文）。
`;

const SHARED_PROPERTIES = {
    title: { type: "string", description: "Meeting title" },
    date: { type: "string", description: "Meeting date (YYYY-MM-DD HH:mm)" },
    duration: { type: "string", description: "Meeting duration (e.g., '45 minutes')" },
    participants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string" }
        },
        required: ["name", "role"],
        additionalProperties: false
      }
    },
    summaryOverview: { type: "string", description: "A concise summary paragraph" },
    summaryGroups: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          modules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                icon: { type: "string", enum: ["Target", "Cpu", "Palette", "Sparkles", "Users", "Shield"] },
                type: { type: "string" },
                color: { type: "string", enum: ["indigo", "sky", "amber", "emerald", "rose", "violet"] },
                points: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["id", "title", "icon", "type", "color", "points"],
              additionalProperties: false
            }
          }
        },
        required: ["id", "title", "modules"],
        additionalProperties: false
      }
    },
    summaryDetails: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          description: { type: "string" }
        },
        required: ["key", "description"],
        additionalProperties: false
      }
    },
    todoList: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          content: { type: "string" },
          completed: { type: "boolean" },
          assignee: { type: "string" }
        },
        required: ["id", "content", "completed", "assignee"],
        additionalProperties: false
      }
    },
    smartChapters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          timestamp: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" }
        },
        required: ["id", "timestamp", "title", "summary"],
        additionalProperties: false
      }
    },
    keyDecisions: {
      type: "array",
      items: { type: "string" }
    },
    goldenMoments: {
      type: "array",
      items: { type: "string" }
    },
    aiDisclaimer: { type: "string" }
};

export const MEETING_JSON_SCHEMA = {
  name: "MeetingMinutes",
  schema: {
    type: "object",
    properties: SHARED_PROPERTIES,
    required: [
      "title", "date", "duration", "participants", "summaryOverview",
      "summaryGroups", "summaryDetails", "todoList", "smartChapters",
      "keyDecisions", "goldenMoments", "aiDisclaimer"
    ],
    additionalProperties: false
  }
};

// Part 1: Meta & Overview & Groups
export const MEETING_PART1_SCHEMA = {
    name: "MeetingPart1",
    schema: {
        type: "object",
        properties: {
            title: SHARED_PROPERTIES.title,
            date: SHARED_PROPERTIES.date,
            duration: SHARED_PROPERTIES.duration,
            participants: SHARED_PROPERTIES.participants,
            summaryOverview: SHARED_PROPERTIES.summaryOverview,
            summaryGroups: SHARED_PROPERTIES.summaryGroups
        },
        required: ["title", "date", "duration", "participants", "summaryOverview", "summaryGroups"],
        additionalProperties: false
    }
};

// Part 2: Details & Smart Chapters
export const MEETING_PART2_SCHEMA = {
    name: "MeetingPart2",
    schema: {
        type: "object",
        properties: {
            summaryDetails: SHARED_PROPERTIES.summaryDetails,
            smartChapters: SHARED_PROPERTIES.smartChapters
        },
        required: ["summaryDetails", "smartChapters"],
        additionalProperties: false
    }
};

// Part 3: Action Items & Outcomes
export const MEETING_PART3_SCHEMA = {
    name: "MeetingPart3",
    schema: {
        type: "object",
        properties: {
            todoList: SHARED_PROPERTIES.todoList,
            keyDecisions: SHARED_PROPERTIES.keyDecisions,
            goldenMoments: SHARED_PROPERTIES.goldenMoments,
            aiDisclaimer: SHARED_PROPERTIES.aiDisclaimer
        },
        required: ["todoList", "keyDecisions", "goldenMoments", "aiDisclaimer"],
        additionalProperties: false
    }
};
