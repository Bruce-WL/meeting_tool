import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../api/app';
import path from 'path';
import fs from 'fs';
import { AsrService } from '../../api/services/asrService';
import { LlmService } from '../../api/services/llmService';

describe('API Integration', () => {
  const dummyDir = path.join(__dirname, 'temp');
  const dummyFile = path.join(dummyDir, 'dummy.mp3');
  
  beforeAll(() => {
     if (!fs.existsSync(dummyDir)) {
         fs.mkdirSync(dummyDir, { recursive: true });
     }
     fs.writeFileSync(dummyFile, 'dummy content');
     
     // Mock Services
     vi.spyOn(AsrService.prototype, 'transcribeAudio').mockResolvedValue('Mock Transcript');
     vi.spyOn(LlmService.prototype, 'analyzeMeetingTranscript').mockImplementation(async (transcript, onProgress) => {
        if (onProgress) {
            onProgress({ stage: 'LLM Analysis (Map Phase)', progress: 50 });
            onProgress({ stage: 'LLM Analysis (Reduce Phase)', progress: 60, details: { partName: 'Part 1', durationMs: 100 } });
            onProgress({ stage: 'LLM Analysis (Reduce Phase)', progress: 70, details: { partName: 'Part 2', durationMs: 100 } });
            onProgress({ stage: 'LLM Analysis (Reduce Phase)', progress: 80, details: { partName: 'Part 3', durationMs: 100 } });
            onProgress({ stage: 'LLM Analysis (Finalize)', progress: 90 });
        }
        return {
             title: 'Mock Meeting',
             summaryOverview: 'Summary',
             summaryGroups: [],
             summaryDetails: [],
             todoList: [],
             smartChapters: [],
             keyDecisions: [],
             goldenMoments: [],
             aiDisclaimer: 'Disclaimer',
             transcript: transcript // Ensure transcript is passed through if needed
         };
     });
  });

  afterAll(() => {
     if (fs.existsSync(dummyFile)) fs.unlinkSync(dummyFile);
     if (fs.existsSync(dummyDir)) fs.rmdirSync(dummyDir);
     vi.restoreAllMocks();
  });

  it('should return 400 if no file uploaded', async () => {
    const res = await request(app).post('/api/meeting/analyze');
    expect(res.status).toBe(400);
  });

  it('should start analysis and complete successfully', async () => {
    const res = await request(app)
      .post('/api/meeting/analyze')
      .attach('audio', dummyFile);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const taskId = res.body.taskId;
    expect(taskId).toBeDefined();

    // Poll for completion
    let status = 'pending';
    let attempts = 0;
    while (status !== 'completed' && status !== 'failed' && attempts < 20) {
        await new Promise(r => setTimeout(r, 100)); // Wait 100ms
        const taskRes = await request(app).get(`/api/meeting/tasks/${taskId}`);
        status = taskRes.body.status;
        attempts++;
    }

    expect(status).toBe('completed');
    
    // Check result
    const taskRes = await request(app).get(`/api/meeting/tasks/${taskId}`);
    expect(taskRes.body.result).toBeDefined();
    expect(taskRes.body.result.transcript).toBe('Mock Transcript');
    expect(taskRes.body.result.title).toBe('Mock Meeting');
  });
  
  it('should return 404 for unknown task', async () => {
      const res = await request(app).get('/api/meeting/tasks/unknown-id');
      expect(res.status).toBe(404);
  });
  
  // Test Auth Routes Stubs
  it('should return 501 for auth routes', async () => {
      const res1 = await request(app).post('/api/auth/login');
      expect(res1.status).toBe(501);
      const res2 = await request(app).post('/api/auth/register');
      expect(res2.status).toBe(501);
      const res3 = await request(app).post('/api/auth/logout');
      expect(res3.status).toBe(501);
  });
  
  // Test 404
  it('should return 404 for unknown route', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.status).toBe(404);
  });

  it('should return health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
