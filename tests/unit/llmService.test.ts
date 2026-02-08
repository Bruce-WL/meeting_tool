import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LlmService } from '../../api/services/llmService';

global.fetch = vi.fn();

describe('LlmService', () => {
  let service: LlmService;

  beforeEach(() => {
    service = new LlmService({ apiKey: 'test-key' });
    vi.clearAllMocks();
  });

  it('should analyze transcript successfully', async () => {
    const validPart1 = { 
        title: "Test Meeting",
        date: "2023-10-01",
        duration: "1h",
        participants: [{name: "A", role: "User"}],
        summaryOverview: "Overview",
        summaryGroups: [{ id: '1', title: 't', modules: [{ id: 'm', title: 'mt', icon: 'Cpu', type: 'tech', color: 'sky', points: ['p'] }] }] 
    };
    const validPart2 = { summaryDetails: [{key: "k", description: "d"}], smartChapters: [{id: "c1", timestamp: "00:00", title: "Intro", summary: "Start"}] };
    const validPart3 = { todoList: [{id: "t1", content: "Do it", completed: false, assignee: "A"}], keyDecisions: ["Decision 1"], goldenMoments: ["Moment 1"], aiDisclaimer: "Disclaimer" };
    
    (fetch as any).mockImplementation(async (url: string, options: any) => {
        const body = JSON.parse(options.body);
        
        // If message contains "Meeting Segment", it's Map phase
        if (body.messages.some((m: any) => m.content.includes('Meeting Segment'))) {
             return { ok: true, json: async () => ({ choices: [{ message: { content: "Summary of segment" } }] }) };
        }
        
        // Reduce phase checks
        const content = body.messages[1].content;
        
        if (content.includes('title, date')) return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(validPart1) } }] }) };
        if (content.includes('summaryDetails')) return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(validPart2) } }] }) };
        if (content.includes('todoList')) return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(validPart3) } }] }) };
        
        return { ok: true, json: async () => ({ choices: [{ message: { content: "{}" } }] }) };
    });

    const result = await service.analyzeMeetingTranscript("A short transcript that is long enough to maybe be split if needed but here it is short.");
    expect(result).toBeDefined();
    expect(result.title).toBe("Test Meeting");
    expect(result.todoList).toHaveLength(1);
  });

  it('should handle map phase errors gracefully', async () => {
     vi.useFakeTimers();
     (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Error',
        text: async () => 'Error'
     });

     const promise = service.analyzeMeetingTranscript("content");
     
     // Advance timers to skip retries
     await vi.runAllTimersAsync();
     
     // Now that we throw errors on failure, this should reject
     await expect(promise).rejects.toThrow();
     
     vi.useRealTimers();
  });
});
