import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { LlmService } from '../../api/services/llmService';

// Mock fetch globally
global.fetch = vi.fn();

describe('LlmService Retry Logic', () => {
  let service: LlmService;

  beforeEach(() => {
    service = new LlmService({ apiKey: 'test-key' });
    vi.useFakeTimers();
    vi.clearAllMocks();
    (global.fetch as Mock).mockReset();
    process.env.MIFY_SKIP_DNS_LOOKUP = 'true';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to mock fetch responses
  const mockFetchResponse = (status: number, body: any, ok: boolean = true) => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok,
      status,
      statusText: ok ? 'OK' : 'Error',
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as Response);
  };

  const mockFetchError = (errorMsg: string) => {
    (global.fetch as Mock).mockRejectedValueOnce(new Error(errorMsg));
  };

  it('should succeed on first attempt (0 retries)', async () => {
    mockFetchResponse(200, { choices: [{ message: { content: 'success' } }] });

    const result = await (service as any).callLlmWithRetry([{ role: 'user', content: 'hi' }]);
    expect(result).toBe('success');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry and succeed after failures (50% failure scenario)', async () => {
    mockFetchError('Network Error 1');
    mockFetchResponse(500, { error: 'Server Error' }, false);
    mockFetchResponse(200, { choices: [{ message: { content: 'recovered' } }] });

    const promise = (service as any).callLlmWithRetry([{ role: 'user', content: 'hi' }]);
    
    await vi.runAllTimersAsync();
    
    const result = await promise;
    expect(result).toBe('recovered');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  }, 10000);

  it('should fail after 5 attempts and generate report (100% failure scenario)', async () => {
    for (let i = 0; i < 5; i++) {
        mockFetchError(`Error ${i+1}`);
    }

    const promise = (service as any).callLlmWithRetry([{ role: 'user', content: 'hi' }]);
    const handled = promise.catch((e: any) => e);
    
    await vi.runAllTimersAsync();

    const error = await handled;
    expect(error.message).toMatch(/LLM Request Failed after 5 attempts/);
    expect(global.fetch).toHaveBeenCalledTimes(5);
  }, 10000);
  
  it('should include retry history in error report', async () => {
    for (let i = 0; i < 5; i++) {
        mockFetchResponse(503, { error: 'Service Unavailable' }, false);
    }

    const promise = (service as any).callLlmWithRetry([{ role: 'user', content: 'hi' }]);
    const handled = promise.catch((e: any) => e);
    await vi.runAllTimersAsync();

    const error = await handled;
    expect(error.message).toContain('LLM Call Failed. Report:');
    const report = JSON.parse(error.message.split('Report: ')[1]);
    expect(report.history).toHaveLength(5);
    expect(report.history[0].httpStatus).toBe(503);
  }, 10000);

  it('should meet success rate, latency, and memory thresholds for 50% and 20% failure scenarios', async () => {
    const runScenario = async (totalCalls: number, failOnceEvery: number) => {
      const durations: number[] = [];
      const startMem = process.memoryUsage().heapUsed;
      let successes = 0;

      for (let i = 0; i < totalCalls; i++) {
        const start = Date.now();
        if (i % failOnceEvery === 0) {
          mockFetchError('Network Error');
          mockFetchResponse(200, { choices: [{ message: { content: 'ok' } }] });
        } else {
          mockFetchResponse(200, { choices: [{ message: { content: 'ok' } }] });
        }

        const promise = (service as any).callLlmWithRetry([{ role: 'user', content: 'hi' }]);
        await vi.runAllTimersAsync();
        await promise;
        successes += 1;
        durations.push(Date.now() - start);
      }

      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      if (typeof (global as any).gc === 'function') {
        (global as any).gc();
      }
      const memDelta = process.memoryUsage().heapUsed - startMem;
      return { avg, memDelta, successRate: successes / totalCalls };
    };

    const totalCalls = 20;
    const scenario50 = await runScenario(totalCalls, 2);
    const scenario20 = await runScenario(totalCalls, 5);

    expect(scenario50.successRate).toBeGreaterThanOrEqual(0.95);
    expect(scenario20.successRate).toBeGreaterThanOrEqual(0.95);
    expect(scenario50.avg).toBeLessThanOrEqual(6000);
    expect(scenario20.avg).toBeLessThanOrEqual(6000);
    expect(scenario50.memDelta).toBeLessThanOrEqual(1024 * 1024);
    expect(scenario20.memDelta).toBeLessThanOrEqual(1024 * 1024);
  }, 20000);
});
