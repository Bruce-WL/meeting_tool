
import type { MeetingData } from '../types/meeting';

const API_BASE_URL = 'http://localhost:3001/api';

export type MeetingResult = Partial<MeetingData> & { transcript?: string };

export interface TaskStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  stage?: string;
  result?: MeetingResult | { data: MeetingResult };
  error?: string;
  logs?: Array<{
    stage: string;
    at: number;
    progress?: number;
    message?: string;
    data?: Record<string, unknown>;
  }>;
  metrics?: {
    startedAt?: number;
    asrDurationMs?: number;
    mapDurationMs?: number;
    reduceDurationsMs?: {
      part1?: number;
      part2?: number;
      part3?: number;
    };
    finalizeDurationMs?: number;
    totalDurationMs?: number;
  };
}

export const uploadFile = async (file: File): Promise<{ taskId: string }> => {
  const formData = new FormData();
  formData.append('audio', file);

  const response = await fetch(`${API_BASE_URL}/meeting/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data;
};

export const getTaskStatus = async (taskId: string): Promise<TaskStatus> => {
  const response = await fetch(`${API_BASE_URL}/meeting/tasks/${taskId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch task status');
  }

  return response.json();
};

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  stage?: string;
  data?: any;
  error?: any;
  [key: string]: any;
}

export const getTaskLogs = async (taskId: string): Promise<LogEntry[]> => {
  const response = await fetch(`${API_BASE_URL}/meeting/tasks/${taskId}/logs`);

  if (!response.ok) {
    throw new Error('Failed to fetch task logs');
  }

  return response.json();
};
