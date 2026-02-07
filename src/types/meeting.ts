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
  date: string;
  duration: string;
  participants: MeetingParticipant[];
  summaryCards: SummaryCard[];
  todoList: TodoItem[];
  smartChapters: SmartChapter[];
  keyDecisions: string[];
  goldenMoments: string[];
}
