import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AsrService } from '../services/asrService.js';
import { LlmService } from '../services/llmService.js';
import { taskService } from '../services/taskService.js';
import { TaskLogger } from '../utils/logger.js';

const router = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check extension
    const allowedExts = ['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.ogg', '.flac', '.wma'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Check MIME type (basic check)
    const allowedMimes = [
        'audio/mpeg', 
        'audio/wav', 
        'audio/x-m4a', 
        'audio/mp4', 
        'audio/aac', 
        'audio/ogg',
        'video/mp4', // Some m4a come as video/mp4
        'application/octet-stream' // Sometimes uploads have generic type
    ];

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
       cb(null, true);
    } else {
       cb(new Error(`Invalid file type. Allowed extensions: ${allowedExts.join(', ')}`));
    }
  }
});

const { MIFY_API_KEY } = process.env;

const apiKey = MIFY_API_KEY;

if (!apiKey) {
  console.error('API Key is missing in environment variables (MIFY_API_KEY required for LLM)');
}

const asrService = new AsrService({ apiKey: MIFY_API_KEY || '' });
const llmService = new LlmService({ apiKey: apiKey || '' });

// 启动时打印 LLM 配置，便于确认已切换
const { MIFY_MAP_MODEL_NAME, MIFY_REDUCE_MODEL_NAME } = process.env;
console.log('[LLM] Configuration: MAP_MODEL=%s, REDUCE_MODEL=%s', 
  MIFY_MAP_MODEL_NAME || 'gpt-5-codex-5', 
  MIFY_REDUCE_MODEL_NAME || 'gpt-5-codex-5'
);

// POST /analyze: Start async processing
router.post('/analyze', upload.single('audio'), async (req, res) => {
  console.log('Meeting analyze request received');
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    // Create task
    const task = taskService.createTask();
    
    // Start background processing with file path
    processMeeting(task.id, req.file.path).catch((err: unknown) => {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error(`Background processing failed for task ${task.id}:`, error);
      taskService.updateTask(task.id, { 
        status: 'failed', 
        error: error.message 
      });
    });

    // Return task ID immediately
    res.json({
      success: true,
      taskId: task.id,
      message: 'Analysis started in background'
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error starting meeting analysis:', err);
    res.status(500).json({
      error: 'Failed to start analysis',
      details: err.message
    });
  }
});

// GET /tasks/:id: Poll task status
router.get('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const task = taskService.getTask(id);

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({
    ...task,
    logs: task.logs ?? [],
    metrics: task.metrics ?? {},
  });
});

// GET /tasks/:id/logs: Get detailed task logs
router.get('/tasks/:id/logs', async (req, res) => {
  const { id } = req.params;
  const logDir = path.join(process.cwd(), 'logs');
  const logPath = path.join(logDir, `task_${id}.log`);

  if (!fs.existsSync(logPath)) {
    // If no log file yet, return empty array
    res.json([]);
    return;
  }

  try {
    const content = await fs.promises.readFile(logPath, 'utf-8');
    const logs = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { message: line }; // Fallback for non-JSON lines
        }
      });
    res.json(logs);
  } catch (error) {
    console.error('Error reading log file:', error);
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

type TaskLogEntry = {
  stage: string;
  at: number;
  progress?: number;
  message?: string;
  data?: Record<string, unknown>;
};

const appendLog = (taskId: string, entry: TaskLogEntry) => {
  const task = taskService.getTask(taskId);
  const logs = task?.logs ? [...task.logs, entry] : [entry];
  taskService.updateTask(taskId, { logs });
};

async function processMeeting(taskId: string, filePath: string) {
  const logger = new TaskLogger(taskId);
  try {
    const taskStartedAt = Date.now();
    // Get file stats
    const stats = await fs.promises.stat(filePath);
    logger.log('TASK', 'Starting processing', { taskId, audioSize: stats.size, filePath });
    
    taskService.updateTask(taskId, { status: 'processing', stage: 'ASR Transcription', progress: 10, metrics: { startedAt: taskStartedAt } });
    appendLog(taskId, { stage: 'ASR Transcription', at: taskStartedAt, progress: 10 });

    // Read file into buffer for ASR (since ASR service expects buffer)
    // Note: For very large files, this should be streamed, but ASR Service needs refactoring for that.
    // For now, we read into memory only when needed, not during upload.
    const audioBuffer = await fs.promises.readFile(filePath);

    // 1. ASR
    const asrStartedAt = Date.now();
    console.log(`[Task ${taskId}] Starting ASR...`);
    const transcript = await asrService.transcribeAudio(audioBuffer, logger);
    console.log(`[Task ${taskId}] ASR completed. Length: ${transcript.length}`);
    const asrDurationMs = Date.now() - asrStartedAt;
    console.log(`[Task ${taskId}] ASR duration: ${asrDurationMs}ms`);
    taskService.updateTask(taskId, { metrics: { ...taskService.getTask(taskId)?.metrics, asrDurationMs } });
    appendLog(taskId, { stage: 'ASR Transcription', at: Date.now(), message: 'ASR completed', data: { transcriptLength: transcript.length, asrDurationMs } });
    
    taskService.updateTask(taskId, { 
      stage: 'LLM Analysis (Map Phase)', 
      progress: 35 
    });
    appendLog(taskId, { stage: 'LLM Analysis (Map Phase)', at: Date.now(), progress: 35 });

    // 2. LLM
    const llmStartedAt = Date.now();
    let mapStartedAt: number | undefined;
    let reduceStartedAt: number | undefined;
    let finalizeStartedAt: number | undefined;
    console.log(`[Task ${taskId}] Starting LLM analysis...`);
    const analysisResult = await llmService.analyzeMeetingTranscript(transcript, (update) => {
      const { stage, progress, details } = update;
      taskService.updateTask(taskId, { stage, progress });
      appendLog(taskId, { stage: stage || 'LLM Update', at: Date.now(), progress, data: details });
      if (stage === 'LLM Analysis (Map Phase)') {
        mapStartedAt = mapStartedAt ?? Date.now();
      }
      if (stage === 'LLM Analysis (Reduce Phase)') {
        if (!reduceStartedAt) {
          reduceStartedAt = Date.now();
          if (mapStartedAt) {
            const mapDurationMs = reduceStartedAt - mapStartedAt;
            taskService.updateTask(taskId, { metrics: { ...taskService.getTask(taskId)?.metrics, mapDurationMs } });
            console.log(`[Task ${taskId}] Map duration: ${mapDurationMs}ms`);
          }
        }
        if (details?.partName) {
          const partName = String(details.partName);
          const durationMs = typeof details.durationMs === 'number' ? details.durationMs : undefined;
          const reduceDurationsMs = { ...(taskService.getTask(taskId)?.metrics?.reduceDurationsMs || {}) };
          if (durationMs !== undefined) {
            if (partName === 'Part 1') reduceDurationsMs.part1 = durationMs;
            if (partName === 'Part 2') reduceDurationsMs.part2 = durationMs;
            if (partName === 'Part 3') reduceDurationsMs.part3 = durationMs;
            taskService.updateTask(taskId, { metrics: { ...taskService.getTask(taskId)?.metrics, reduceDurationsMs } });
            console.log(`[Task ${taskId}] Reduce ${partName} duration: ${durationMs}ms`);
          }
        }
      }
      if (stage === 'LLM Analysis (Finalize)') {
        finalizeStartedAt = finalizeStartedAt ?? Date.now();
      }
    }, logger);
    console.log(`[Task ${taskId}] LLM analysis completed.`);
    const llmDurationMs = Date.now() - llmStartedAt;
    if (finalizeStartedAt) {
      const finalizeDurationMs = Date.now() - finalizeStartedAt;
      taskService.updateTask(taskId, { metrics: { ...taskService.getTask(taskId)?.metrics, finalizeDurationMs } });
      console.log(`[Task ${taskId}] Finalize duration: ${finalizeDurationMs}ms`);
    }
    console.log(`[Task ${taskId}] LLM total duration: ${llmDurationMs}ms`);
    appendLog(taskId, { stage: 'LLM Analysis', at: Date.now(), message: 'LLM completed', data: { llmDurationMs } });

    // 3. Complete
    const totalDurationMs = Date.now() - taskStartedAt;
    const metrics = { ...taskService.getTask(taskId)?.metrics, totalDurationMs };
    taskService.updateTask(taskId, { metrics });
    const fmt = (ms: number | undefined) => (ms != null ? `${(ms / 1000).toFixed(1)}s` : '-');
    const summary = [
      `ASR=${fmt(metrics.asrDurationMs)}`,
      `Map=${fmt(metrics.mapDurationMs)}`,
      `Reduce P1=${fmt(metrics.reduceDurationsMs?.part1)} P2=${fmt(metrics.reduceDurationsMs?.part2)} P3=${fmt(metrics.reduceDurationsMs?.part3)}`,
      `Finalize=${fmt(metrics.finalizeDurationMs)}`,
      `Total=${fmt(totalDurationMs)}`
    ].join(', ');
    console.log(`[Task ${taskId}] 时延汇总: ${summary}`);
    logger.log('TASK', 'Processing completed (时延汇总)', { totalDurationMs, asrDurationMs: metrics.asrDurationMs, mapDurationMs: metrics.mapDurationMs, reduceDurationsMs: metrics.reduceDurationsMs, finalizeDurationMs: metrics.finalizeDurationMs, summary });

    const normalizeMeetingDate = (value: string | undefined, fallbackMs: number) => {
      if (value) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          const year = parsed.getFullYear();
          const fallbackYear = new Date(fallbackMs).getFullYear();
          if (Math.abs(year - fallbackYear) <= 1) {
            return value;
          }
        }
      }
      const fallbackDate = new Date(fallbackMs);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${fallbackDate.getFullYear()}-${pad(fallbackDate.getMonth() + 1)}-${pad(fallbackDate.getDate())} ${pad(fallbackDate.getHours())}:${pad(fallbackDate.getMinutes())}`;
    };
    const taskCreatedAt = taskService.getTask(taskId)?.createdAt ?? taskStartedAt;
    const uploadTime = new Date(taskCreatedAt).toISOString();
    const normalizedDate = normalizeMeetingDate((analysisResult as { date?: string }).date, taskCreatedAt);

    taskService.updateTask(taskId, {
      status: 'completed',
      progress: 100,
      stage: 'Finished',
      result: {
        ...analysisResult,
        date: normalizedDate,
        uploadTime,
        transcript
      }
    });
    appendLog(taskId, { stage: 'Finished', at: Date.now(), progress: 100, data: { totalDurationMs } });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error(`[Task ${taskId}] Processing failed:`, err);
    if (logger) logger.error('TASK', 'Processing failed', err);
    
    taskService.updateTask(taskId, {
      status: 'failed',
      error: err.message
    });
    appendLog(taskId, { stage: 'Failed', at: Date.now(), message: err.message });
  } finally {
    // Cleanup file
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`[Task ${taskId}] Cleaned up uploaded file: ${filePath}`);
      }
    } catch (cleanupErr) {
      console.error(`[Task ${taskId}] Failed to cleanup file:`, cleanupErr);
    }
  }
}

export default router;
