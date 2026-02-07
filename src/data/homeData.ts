import { SummaryGroup } from '../types/meeting';

export const homeSummaryOverview =
  '上传录音后自动生成结构化纪要，提炼关键信息，帮助团队高效同步与执行。';

export const homeSummaryGroups: SummaryGroup[] = [
  {
    id: 'home_group_1',
    title: '核心能力',
    modules: [
      {
        id: 'home_module_1',
        title: '智能纪要生成',
        icon: 'Sparkles',
        type: '亮点',
        color: 'violet',
        points: [
          '从录音到结构化纪要（要点、结论、待办）',
          '自动识别发言人与时间轴，支持中英文混说',
          '关键决策与风险提醒高亮，便于快速复盘',
        ],
      },
      {
        id: 'home_module_2',
        title: '协作与执行闭环',
        icon: 'Users',
        type: '协作',
        color: 'emerald',
        points: [
          '待办自动分派到人，支持截止时间与优先级',
          '与日历/项目管理工具联动，纪要一键同步',
          '可分享链接与权限控制，评论与追踪进展',
        ],
      },
      {
        id: 'home_module_3',
        title: '安全与合规',
        icon: 'Shield',
        type: '安全',
        color: 'amber',
        points: [
          '全程加密传输与存储，支持企业级密钥管理',
          '私有化部署与数据隔离，符合国内合规要求',
          '可配置数据留存周期，支持合规导出',
        ],
      },
    ],
  },
];
