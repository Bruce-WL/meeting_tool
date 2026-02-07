import { MeetingData } from '../types/meeting';

export const meetingData: MeetingData = {
  id: 'mtg_001',
  title: '产品需求评审会议 - AI会议纪要工具',
  date: '2023-10-24 14:00',
  duration: '45分钟',
  participants: [
    { name: 'Alex', role: '产品经理' },
    { name: 'Bob', role: '前端开发' },
    { name: 'Charlie', role: '后端开发' },
    { name: 'David', role: 'UI设计师' },
  ],
  summaryCards: [
    {
      id: 'card_1',
      title: '产品目标',
      icon: 'Target',
      type: '核心',
      points: [
        '开发一款AI驱动的会议纪要生成工具',
        '支持音频上传与实时转写',
        '自动提取关键决策与待办事项',
      ],
    },
    {
      id: 'card_2',
      title: '技术架构',
      icon: 'Cpu',
      type: '技术',
      points: [
        '前端采用 React + Tailwind CSS',
        '后端使用 Node.js + Express',
        '接入大模型API进行文本处理',
      ],
    },
    {
      id: 'card_3',
      title: 'UI/UX规范',
      icon: 'Palette',
      type: '设计',
      points: [
        '保持简洁现代的视觉风格',
        '使用 Lucide 图标库',
        '卡片式布局，清晰展示信息层级',
      ],
    },
  ],
  todoList: [
    { id: 'todo_1', content: '完成产品需求文档 (PRD) 的最终确认', completed: true, assignee: 'Alex' },
    { id: 'todo_2', content: '搭建项目基础架构与代码仓库', completed: false, assignee: 'Bob' },
    { id: 'todo_3', content: '设计高保真UI原型图', completed: false, assignee: 'David' },
    { id: 'todo_4', content: '调研并确定语音转文字的API服务商', completed: false, assignee: 'Charlie' },
  ],
  smartChapters: [
    {
      id: 'chap_1',
      timestamp: '00:00',
      title: '会议开场与背景介绍',
      summary: 'Alex 介绍了本次会议的目的，即启动AI会议纪要工具的开发项目，并简要回顾了市场调研结果。',
    },
    {
      id: 'chap_2',
      timestamp: '05:30',
      title: '核心功能模块讨论',
      summary: '团队讨论了核心功能，包括录音上传、自动转写、智能摘要生成以及待办事项提取。大家一致认为"准确性"是首要指标。',
    },
    {
      id: 'chap_3',
      timestamp: '20:15',
      title: '技术选型与架构设计',
      summary: 'Bob 和 Charlie 确定了前后端技术栈。前端使用 React，后端使用 Express。讨论了如何处理大文件上传的问题。',
    },
    {
      id: 'chap_4',
      timestamp: '35:00',
      title: '设计规范与下一步计划',
      summary: 'David 展示了初步的设计概念。Alex 布置了接下来的任务分配和时间节点。',
    },
  ],
  keyDecisions: [
    '确定使用 React + Tailwind CSS 作为前端技术栈。',
    '首期版本优先支持 MP3 和 WAV 格式的音频文件。',
    'UI设计风格定为简洁商务风，主色调采用蓝色系。',
  ],
  goldenMoments: [
    '"我们的目标不仅仅是记录会议，而是让会议内容产生价值。" - Alex',
    '"用户体验的流畅度决定了工具的生命力。" - David',
  ],
};
