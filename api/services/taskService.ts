import { v4 as uuidv4 } from 'uuid';
import db from '../utils/db.js';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Task {
  id: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  result?: unknown;
  error?: string;
  progress?: number; // 0-100
  stage?: string; // e.g., "Transcribing", "Analyzing Segment 1/3", "Synthesizing"
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

class TaskService {
  createTask(): Task {
    const id = uuidv4();
    const now = Date.now();
    const task: Task = {
      id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      progress: 0,
      logs: [],
      metrics: { startedAt: now },
    };

    const stmt = db.prepare(`
      INSERT INTO tasks (id, status, created_at, updated_at, progress, stage, result, error, logs, metrics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      task.id,
      task.status,
      task.createdAt,
      task.updatedAt,
      task.progress,
      task.stage || null,
      task.result ? JSON.stringify(task.result) : null,
      task.error || null,
      JSON.stringify(task.logs),
      JSON.stringify(task.metrics)
    );

    return task;
  }

  getTask(id: string): Task | undefined {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return undefined;

    return this.mapRowToTask(row);
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const currentTask = this.getTask(id);
    if (!currentTask) return undefined;

    const updatedTask = {
      ...currentTask,
      ...updates,
      updatedAt: Date.now()
    };

    const stmt = db.prepare(`
      UPDATE tasks
      SET status = ?, updated_at = ?, progress = ?, stage = ?, result = ?, error = ?, logs = ?, metrics = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedTask.status,
      updatedTask.updatedAt,
      updatedTask.progress,
      updatedTask.stage || null,
      updatedTask.result ? JSON.stringify(updatedTask.result) : null,
      updatedTask.error || null,
      JSON.stringify(updatedTask.logs),
      JSON.stringify(updatedTask.metrics),
      id
    );

    return updatedTask;
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      status: row.status as TaskStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      progress: row.progress,
      stage: row.stage || undefined,
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error || undefined,
      logs: row.logs ? JSON.parse(row.logs) : [],
      metrics: row.metrics ? JSON.parse(row.metrics) : undefined,
    };
  }
}

// Singleton instance
export const taskService = new TaskService();
