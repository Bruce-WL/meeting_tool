export interface MeetingParticipant {
  name: string;
  role?: string;
  avatar?: string;
}

export interface SummaryCard {
  id: string;
  title: string;
  icon: string; // Icon name from lucide-react
  type: string; // Badge text
  points: string[];
}

export interface SummaryModule {
  id: string;
  title: string;
  icon: string;
  type: string;
  color: string;
  points: string[];
}

export interface SummaryGroup {
  id: string;
  title: string;
  modules: SummaryModule[];
}

export interface SummaryDetail {
  key: string;
  description: string;
}

export interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
  assignee?: string;
}

export interface SmartChapter {
  id: string;
  timestamp: string; // e.g., "00:15"
  title: string;
  summary: string;
}

export interface MeetingData {
  id: string;
  title: string;
  meetingTopic: string;
  uploadTime: string;
  aiDisclaimer: string;
  date: string;
  duration: string;
  participants: MeetingParticipant[];
  summaryOverview?: string;
  summaryCards: SummaryCard[];
  summaryGroups?: SummaryGroup[];
  summaryHighlights?: string[];
  summaryDetails?: SummaryDetail[];
  todoList: TodoItem[];
  smartChapters: SmartChapter[];
  keyDecisions: string[];
  goldenMoments: string[];
}
