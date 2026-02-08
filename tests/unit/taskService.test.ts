import { describe, it, expect, beforeEach } from 'vitest';
import { taskService } from '../../api/services/taskService';
import db from '../../api/utils/db';

describe('TaskService', () => {
  beforeEach(() => {
    // Clear DB
    db.prepare('DELETE FROM tasks').run();
  });

  it('should create a task', () => {
    const task = taskService.createTask();
    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.status).toBe('pending');
  });

  it('should get a task', () => {
    const task = taskService.createTask();
    const fetched = taskService.getTask(task.id);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(task.id);
  });

  it('should update a task', () => {
    const task = taskService.createTask();
    taskService.updateTask(task.id, { status: 'processing', progress: 50 });
    const fetched = taskService.getTask(task.id);
    expect(fetched?.status).toBe('processing');
    expect(fetched?.progress).toBe(50);
  });

  it('should handle partial updates correctly', () => {
    const task = taskService.createTask();
    taskService.updateTask(task.id, { metrics: { asrDurationMs: 100 } });
    let fetched = taskService.getTask(task.id);
    expect(fetched?.metrics?.asrDurationMs).toBe(100);

    taskService.updateTask(task.id, { metrics: { ...fetched?.metrics, mapDurationMs: 200 } });
    fetched = taskService.getTask(task.id);
    expect(fetched?.metrics?.asrDurationMs).toBe(100);
    expect(fetched?.metrics?.mapDurationMs).toBe(200);
  });
});
